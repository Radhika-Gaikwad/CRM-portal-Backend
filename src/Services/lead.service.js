import Lead from "../Model/Lead.js";
import User from "../Model/User.js";

// ✅ Helper to safely check if a user is in the assignedTo array
const isAssignedToExec = (lead, userId) => {
  if (!lead.assignedTo || lead.assignedTo.length === 0) return false;
  return lead.assignedTo.some(e => e.toString() === userId.toString() || e._id?.toString() === userId.toString());
};

const isAssignedToManager = (lead, userId) => {
  if (!lead.managerId) return false;
  return lead.managerId.toString() === userId.toString() || lead.managerId._id?.toString() === userId.toString();
};

export const getLeads = async (user, query) => {
  const { role, _id } = user;
  let filter = { isDeleted: false };

  if (role === "admin") {
    // Admin sees all
  } else if (role === "manager") {
    filter.$or = [{ assignedTo: _id }, { managerId: _id }];
  } else if (role === "executive") {
    filter.assignedTo = _id; // Mongoose safely checks arrays for this
  }

  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.fromDate && query.toDate) {
    filter.createdAt = { $gte: new Date(query.fromDate), $lte: new Date(query.toDate) };
  }

  return await Lead.find(filter)
    .populate("assignedTo", "name email role")
    .populate("managerId", "name email")
    .populate("assignedBy", "name email")
    .sort({ createdAt: -1 });
};

export const getLeadById = async (user, leadId) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Lead not found");

  if (user.role === "executive" && !isAssignedToExec(lead, user._id)) throw new Error("Access denied");
  if (user.role === "manager" && !isAssignedToManager(lead, user._id) && !isAssignedToExec(lead, user._id)) throw new Error("Access denied");

  return lead;
};

export const createLead = async (user, data) => {
  if (user.role !== "admin") throw new Error("Only admin can create leads");
  return await Lead.create({
    ...data,
    assignedBy: user._id,
    statusHistory: [{ status: "New", changedBy: user._id }],
  });
};

export const updateLead = async (user, leadId, data) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Lead not found");

  if (user.role === "executive") throw new Error("Executives cannot edit lead details");
  if (user.role === "manager" && !isAssignedToManager(lead, user._id)) throw new Error("Access denied");

  Object.assign(lead, data);
  await lead.save();
  return lead;
};

export const deleteLead = async (user, leadId) => {
  if (user.role !== "admin") throw new Error("Only admin can delete leads");

  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Lead not found");

  lead.isDeleted = true;
  await lead.save();
  return { message: "Lead deleted successfully" };
};

// ✅ UPGRADED: Properly handles array of Executives
export const assignLead = async (user, leadId, { assignedTo, managerId }) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Lead not found");
  if (user.role === "executive") throw new Error("Executives cannot assign leads");

  if (user.role === "admin") {
    if (managerId) {
      const manager = await User.findOne({ _id: managerId, role: "manager" });
      if (!manager) throw new Error("Invalid manager");
      lead.managerId = managerId;
    }
    
    if (assignedTo !== undefined) {
      const execIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      const validExecIds = execIds.filter(id => id);
      
      if (validExecIds.length > 0) {
        const execs = await User.find({ _id: { $in: validExecIds }, role: "executive" });
        if (execs.length !== validExecIds.length) throw new Error("One or more invalid executives");
        lead.assignedTo = validExecIds; 
      } else {
        lead.assignedTo = []; 
      }
    }
    lead.assignedBy = user._id;
  }

  if (user.role === "manager") {
    if (!isAssignedToManager(lead, user._id)) throw new Error("You can only assign your team leads");
    
    if (assignedTo !== undefined) {
      const execIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      const validExecIds = execIds.filter(id => id);
      
      if (validExecIds.length > 0) {
        const execs = await User.find({ _id: { $in: validExecIds }, role: "executive", managerId: user._id });
        if (execs.length !== validExecIds.length) throw new Error("You can only assign to your team members");
        lead.assignedTo = validExecIds;
      } else {
        lead.assignedTo = [];
      }
    }
    lead.assignedBy = user._id;
  }

  await lead.save();
  return lead;
};

export const updateLeadStatus = async (user, leadId, status) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Lead not found");

  if (user.role === "executive" && !isAssignedToExec(lead, user._id)) throw new Error("Access denied");
  if (user.role === "manager" && !isAssignedToManager(lead, user._id) && !isAssignedToExec(lead, user._id)) throw new Error("Access denied");

  lead.status = status;
  lead.statusHistory.push({ status, changedBy: user._id });
  await lead.save();
  return lead;
};

export const addNote = async (user, leadId, text, noteId = null) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Lead not found");

  if (user.role === "executive" && !isAssignedToExec(lead, user._id)) throw new Error("Access denied");
  if (user.role === "manager" && !isAssignedToManager(lead, user._id) && !isAssignedToExec(lead, user._id)) throw new Error("Access denied");

  if (noteId) {
    const existingNote = lead.notes.id(noteId);
    if (!existingNote) throw new Error("Note not found");
    if (user.role !== "admin" && existingNote.createdBy.toString() !== user._id.toString()) throw new Error("You can only edit your own notes");
    existingNote.text = text;
  } else {
    lead.notes.push({ text, createdBy: user._id });
  }

  await lead.save();
  return lead;
};

export const addActivity = async (user, leadId, activityData) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Lead not found");

  if (user.role === "executive" && !isAssignedToExec(lead, user._id)) throw new Error("Access denied");

  lead.activities.push({ ...activityData, createdBy: user._id });
  await lead.save();
  return lead;
};