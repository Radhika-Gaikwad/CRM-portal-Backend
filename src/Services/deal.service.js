import Deal from "../Model/Deal.js";
import Lead from "../Model/Lead.js";
import Customer from "../Model/Customer.js"; // ✅ Imported Customer Model

// ==========================================
// 🔐 HELPER: ACCESS VALIDATION
// ==========================================
const validateLeadAccess = async (leadId, userId, role) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Associated lead not found or deleted");

  if (role === "manager") {
    const isManager = lead.managerId?.toString() === userId.toString();
    const isExec = lead.assignedTo?.some(e => e.toString() === userId.toString());
    if (!isManager && !isExec) throw new Error("You do not have access to this lead");
  } else if (role === "executive") {
    const isExec = lead.assignedTo?.some(e => e.toString() === userId.toString());
    if (!isExec) throw new Error("You do not have access to this lead");
  }
  return lead;
};

// ==========================================
// ⚙️ HELPER: AUTOMATE CUSTOMER CREATION
// ==========================================
// This automatically creates or updates a customer when a deal is Won
const handleDealWon = async (deal) => {
  // Note: deal.leadId is already populated by getDealById
  const lead = deal.leadId; 
  if (!lead) return;

  const existingCustomer = await Customer.findOne({ originalLeadId: lead._id });

  if (!existingCustomer) {
    // BRAND NEW CUSTOMER: Graduate the Lead into the Customer Database
    await Customer.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      originalLeadId: lead._id,
      purchaseHistory: [deal._id],
      lifetimeValue: deal.value, // Their first purchase amount
      assignedTo: deal.assignedTo, // Keep the same executive
      managerId: deal.managerId,   // Keep the same manager
      accountStatus: "Active"
    });

    // Mark the original Lead as converted so they drop off the active leads pipeline
    await Lead.findByIdAndUpdate(lead._id, { status: "Converted" });

  } else {
    // RETURNING CUSTOMER: They bought something again!
    // Add the new deal to their history and increase their Lifetime Value (LTV)
    if (!existingCustomer.purchaseHistory.includes(deal._id)) {
      existingCustomer.purchaseHistory.push(deal._id);
      existingCustomer.lifetimeValue += deal.value;
      existingCustomer.accountStatus = "Active"; // Ensure they are marked active again
      await existingCustomer.save();
    }
  }
};

// ==========================================
// 🚀 CORE SERVICES
// ==========================================

export const createDeal = async (user, data) => {
  // Validate access and grab the lead to inherit the manager/exec structure
  const lead = await validateLeadAccess(data.leadId, user._id, user.role);

  // If the user didn't specify assignees, default to the people assigned to the lead
  let execIds = data.assignedTo && data.assignedTo.length > 0
    ? data.assignedTo
    : lead.assignedTo;

  // Ensure it's an array
  execIds = Array.isArray(execIds) ? execIds : (execIds ? [execIds] : []);

  // Automatically inherit the manager from the lead if not explicitly provided
  const managerId = data.managerId || lead.managerId;

  return await Deal.create({
    ...data,
    assignedTo: execIds,
    managerId: managerId,
    createdBy: user._id,
  });
};

export const getDeals = async (user, query) => {
  const { role, _id } = user;
  let filter = { isDeleted: false };

  // 🔐 Role-Based Access Control Filtering
  if (role === "admin") {
    // Admins see all non-deleted deals
  } else if (role === "manager") {
    // Managers see deals assigned to their team OR deals assigned to them directly
    filter.$or = [{ managerId: _id }, { assignedTo: _id }];
  } else if (role === "executive") {
    // Executives ONLY see deals explicitly assigned to them
    filter.assignedTo = _id;
  }

  // Optional query parameters from the frontend filters
  if (query.stage) filter.stage = query.stage;
  if (query.execId) filter.assignedTo = query.execId;
  if (query.leadId) filter.leadId = query.leadId;

  return await Deal.find(filter)
    .populate("assignedTo", "name email role")
    .populate("managerId", "name email")
    .populate("leadId", "name company email phone")
    .sort({ expectedCloseDate: 1 }); // Sort by closest deadline
};

export const getDealById = async (user, dealId) => {
  const deal = await Deal.findById(dealId)
    .populate("assignedTo", "name email role")
    .populate("managerId", "name email")
    .populate("leadId", "name company email phone")
    .populate("notes.createdBy", "name");

  if (!deal || deal.isDeleted) throw new Error("Deal not found");

  // 🔐 Access Check
  if (user.role === "executive") {
    const isAssignee = deal.assignedTo.some(e => e._id.toString() === user._id.toString());
    if (!isAssignee) throw new Error("Access denied");
  } else if (user.role === "manager") {
    const isManager = deal.managerId?._id.toString() === user._id.toString();
    const isAssignee = deal.assignedTo.some(e => e._id.toString() === user._id.toString());
    if (!isManager && !isAssignee) throw new Error("Access denied");
  }

  return deal;
};

export const updateDealStage = async (user, dealId, stage) => {
  const deal = await getDealById(user, dealId); // Reuses the access check above

  deal.stage = stage;
  await deal.save();

  // ✅ AUTOMATION TRIGGER: If deal is won, process customer creation
  if (stage === "Won") {
    await handleDealWon(deal);
  }

  return deal;
};

export const updateDealDetails = async (user, dealId, data) => {
  const deal = await getDealById(user, dealId); // Access check

  // Only Admins or Managers can reassign deals
  if (data.assignedTo || data.managerId) {
    if (user.role === "executive") {
      throw new Error("Executives cannot reassign deals");
    }
    // Ensure assignedTo is processed correctly
    if (data.assignedTo) {
      data.assignedTo = Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo];
    }
  }

  Object.assign(deal, data);
  await deal.save();

  // ✅ AUTOMATION TRIGGER: Catch if stage is updated via the form
  if (data.stage === "Won") {
    await handleDealWon(deal);
  }

  return deal;
};

export const deleteDeal = async (user, dealId) => {
  const deal = await getDealById(user, dealId); // Access check

  if (user.role === "executive") throw new Error("Executives cannot delete deals");

  deal.isDeleted = true;
  await deal.save();
  return { message: "Deal deleted successfully" };
};

export const addDealNote = async (user, dealId, text) => {
  const deal = await getDealById(user, dealId); // Access check

  deal.notes.push({ text, createdBy: user._id });
  await deal.save();
  return deal;
};