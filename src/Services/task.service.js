import Task from "../Model/Task.js";
import Lead from "../Model/Lead.js";

const validateLeadAccess = async (leadId, userId, role) => {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.isDeleted) throw new Error("Associated lead not found");

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

export const createTask = async (user, data) => {
  if (user.role === "executive") throw new Error("Executives cannot assign tasks");
  await validateLeadAccess(data.leadId, user._id, user.role);

  // ✅ Ensure assignedTo is an array
  const execIds = Array.isArray(data.assignedTo) ? data.assignedTo : (data.assignedTo ? [data.assignedTo] : []);

  return await Task.create({
    ...data,
    assignedTo: execIds,
    assignedBy: user._id,
  });
};

export const getTasks = async (user, query) => {
  const { role, _id } = user;
  let filter = { isDeleted: false };

  if (role === "admin") {
    // Sees all
  } else if (role === "manager") {
    filter.$or = [{ assignedBy: _id }, { assignedTo: _id }];
  } else if (role === "executive") {
    filter.assignedTo = _id; // Mongoose safely checks arrays
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.leadId) filter.leadId = query.leadId;
  if (query.taskType) filter.taskType = query.taskType;

  return await Task.find(filter)
    .populate("assignedTo", "name email role")
    .populate("assignedBy", "name email role")
    .populate("leadId", "name company")
    .sort({ dueDate: 1 });
};

export const updateTaskStatus = async (user, taskId, status) => {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error("Task not found");

  // ✅ Check if user is admin, assigner, or in the assignedTo array
  const isAssignee = task.assignedTo.some(e => e.toString() === user._id.toString());
  if (user.role !== "admin" && task.assignedBy.toString() !== user._id.toString() && !isAssignee) {
    throw new Error("Not authorized to update this task");
  }

  task.status = status;
  await task.save();
  return task;
};

export const updateTaskDetails = async (user, taskId, data) => {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error("Task not found");

  if (user.role !== "admin" && task.assignedBy.toString() !== user._id.toString()) {
    throw new Error("Only the assigner can edit task details");
  }

  // ✅ Ensure assignedTo is processed correctly
  if (data.assignedTo) {
    data.assignedTo = Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo];
  }

  Object.assign(task, data);
  await task.save();
  return task;
};

export const deleteTask = async (user, taskId) => {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error("Task not found");

  if (user.role !== "admin" && task.assignedBy.toString() !== user._id.toString()) {
    throw new Error("Only the assigner can delete this task");
  }

  task.isDeleted = true;
  await task.save();
  return { message: "Task deleted successfully" };
};