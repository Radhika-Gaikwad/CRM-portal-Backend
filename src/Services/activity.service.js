import Activity from "../Model/Activity.js";

// ✅ CREATE ACTIVITY
export const createActivity = async (user, data) => {
  // Automatically bind the current user and their manager to the activity for RBAC
  const activityData = {
    ...data,
    performedBy: user._id,
    managerId: user.managerId || null, // Inherit manager from the logged-in user
  };

  return await Activity.create(activityData);
};

// ✅ GET ALL ACTIVITIES (With Automatic RBAC)
export const getActivities = async (user, query) => {
  const { role, _id } = user;
  let filter = { isDeleted: false };

  // 🔐 Apply Hierarchy Filters
  if (role === "admin") {
    // Admin sees all
  } else if (role === "manager") {
    // Manager sees activities performed by their team OR by themselves
    filter.$or = [{ managerId: _id }, { performedBy: _id }];
  } else if (role === "executive") {
    // Executive ONLY sees their own logged activities
    filter.performedBy = _id;
  }

  // 🔍 Optional Frontend Filters
  if (query.type) filter.type = query.type;
  if (query.leadId) filter.leadId = query.leadId;
  if (query.dealId) filter.dealId = query.dealId;
  if (query.customerId) filter.customerId = query.customerId;
  if (query.execId && role !== "executive") filter.performedBy = query.execId;

  return await Activity.find(filter)
    .populate("performedBy", "name email role")
    .populate("leadId", "name company")
    .populate("dealId", "name value")
    .populate("customerId", "name company")
    .sort({ activityDate: -1 }); // Newest first
};

// ✅ GET SINGLE ACTIVITY
export const getActivityById = async (user, activityId) => {
  const activity = await Activity.findById(activityId)
    .populate("performedBy", "name email")
    .populate("leadId", "name")
    .populate("dealId", "name")
    .populate("customerId", "name");

  if (!activity || activity.isDeleted) throw new Error("Activity not found");

  // RBAC Validation
  if (user.role === "executive" && activity.performedBy._id.toString() !== user._id.toString()) {
    throw new Error("Access Denied: You did not log this activity");
  }
  if (user.role === "manager" && activity.managerId?.toString() !== user._id.toString() && activity.performedBy._id.toString() !== user._id.toString()) {
    throw new Error("Access Denied: This activity belongs to another team");
  }

  return activity;
};

// ✅ UPDATE ACTIVITY
export const updateActivity = async (user, activityId, data) => {
  const activity = await getActivityById(user, activityId); // Reuses RBAC check

  // Only the person who created the activity or an admin can edit it
  if (user.role !== "admin" && activity.performedBy._id.toString() !== user._id.toString()) {
    throw new Error("Access Denied: You can only edit your own activities");
  }

  Object.assign(activity, data);
  await activity.save();
  return activity;
};

// ✅ DELETE ACTIVITY
export const deleteActivity = async (user, activityId) => {
  const activity = await getActivityById(user, activityId); // Reuses RBAC check

  if (user.role === "executive") {
    throw new Error("Executives cannot delete activity logs. Contact your manager.");
  }

  activity.isDeleted = true;
  await activity.save();
  return { message: "Activity log deleted successfully" };
};