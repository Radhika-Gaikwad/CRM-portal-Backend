import Customer from "../Model/Customer.js";
import Activity from "../Model/Activity.js"; // ✅ Critical addition for Audit Trailing

// ==========================================
// 🔐 HELPER: ACCESS VALIDATION
// ==========================================
// Helper: Ensure the user has permission to interact with this specific customer
const validateCustomerAccess = async (customerId, user) => {
  const customer = await Customer.findById(customerId)
    .populate("assignedTo", "name email role")
    .populate("managerId", "name email")
    .populate("purchaseHistory", "name value expectedCloseDate stage");

  if (!customer || customer.isDeleted) throw new Error("Customer not found");

  // 1. Admin Rule: Full Access
  if (user.role === "admin") return customer;

  // 2. Manager Rule: Must own the team handling the customer
  if (user.role === "manager") {
    const isManager = customer.managerId?._id.toString() === user._id.toString();
    const isExec = customer.assignedTo?.some(e => e._id.toString() === user._id.toString());
    if (!isManager && !isExec) throw new Error("Access Denied: Customer belongs to another team");
  }

  // 3. Executive Rule: Must be explicitly assigned to this customer
  if (user.role === "executive") {
    const isExec = customer.assignedTo?.some(e => e._id.toString() === user._id.toString());
    if (!isExec) throw new Error("Access Denied: You are not assigned to this account");
  }

  return customer;
};

// ==========================================
// 🚀 CORE SERVICES
// ==========================================

// GET CUSTOMERS (With Automatic RBAC Filtering)
export const getCustomers = async (user, query) => {
  const { role, _id } = user;
  let filter = { isDeleted: false };

  // 🔐 Apply Hierarchy Filters
  if (role === "admin") {
    // Admin sees all (Filter remains empty)
  } else if (role === "manager") {
    // Manager sees customers managed by them OR assigned to them directly
    filter.$or = [{ managerId: _id }, { assignedTo: _id }];
  } else if (role === "executive") {
    // Executive ONLY sees customers explicitly assigned to them
    filter.assignedTo = _id;
  }

  // Apply optional frontend query parameters
  if (query.accountStatus) filter.accountStatus = query.accountStatus;
  if (query.execId && role !== "executive") filter.assignedTo = query.execId;

  return await Customer.find(filter)
    .populate("assignedTo", "name email role")
    .populate("managerId", "name email")
    .sort({ lifetimeValue: -1 }); // Sort by most valuable customers first
};

// GET SINGLE CUSTOMER
export const getCustomerById = async (user, customerId) => {
  return await validateCustomerAccess(customerId, user);
};

// ==========================================
// 📝 POST-SALE OPERATIONS
// ==========================================

// POST-SALE: ADD FOLLOW-UP NOTE
export const addCustomerNote = async (user, customerId, text) => {
  if (!text) throw new Error("Note text is required");
  const customer = await validateCustomerAccess(customerId, user);

  // 1. Save the note to the customer profile
  customer.notes.push({ text, createdBy: user._id });
  await customer.save();

  // 2. 🚀 AUTOMATION: Log this action in the master Activity Trail
  await Activity.create({
    type: "Note",
    description: `Follow-up note added: "${text}"`,
    customerId: customer._id,
    performedBy: user._id,
    managerId: user.managerId || customer.managerId?._id // Fallback to customer's manager if user has none
  });

  return customer;
};

// POST-SALE: LOG SUPPORT CALL
export const logSupportCall = async (user, customerId, supportData) => {
  const { issueSummary, resolution, status } = supportData;
  if (!issueSummary) throw new Error("Issue summary is required");

  const customer = await validateCustomerAccess(customerId, user);

  // 1. Save the support ticket to the customer profile
  customer.supportLogs.push({
    issueSummary,
    resolution,
    status: status || "Open",
    loggedBy: user._id,
  });

  // Smart feature: If a support ticket is Open, flag the account as "At Risk" to alert managers
  if (status === "Open" && customer.accountStatus === "Active") {
    customer.accountStatus = "At Risk";
  }

  await customer.save();

  // 2. 🚀 AUTOMATION: Log this action in the master Activity Trail
  await Activity.create({
    type: "Call", // Categorizing support interactions as Calls
    description: `Support Ticket (${status}): ${issueSummary}`,
    customerId: customer._id,
    performedBy: user._id,
    managerId: user.managerId || customer.managerId?._id
  });

  return customer;
};

// MANAGER/ADMIN: UPDATE ACCOUNT HEALTH STATUS
export const updateAccountStatus = async (user, customerId, status) => {
  if (user.role === "executive") throw new Error("Only Managers and Admins can change account health status");

  const customer = await validateCustomerAccess(customerId, user);
  const oldStatus = customer.accountStatus;

  customer.accountStatus = status;
  await customer.save();

  // 🚀 AUTOMATION: Log health status changes so admins can track manager interventions
  if (oldStatus !== status) {
    await Activity.create({
      type: "Note", // Administrative note
      description: `Account health status changed from [${oldStatus}] to [${status}]`,
      customerId: customer._id,
      performedBy: user._id,
      managerId: user.managerId || user._id // If manager did it, they are the manager
    });
  }

  return customer;
};