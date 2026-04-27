import Team from "../Model/Team.js";
import User from "../Model/User.js";

// ==========================================
// 🚀 TEAM MANAGEMENT SERVICES
// ==========================================

// ✅ CREATE TEAM (Admin Only)
export const createTeam = async (user, data) => {
  if (user.role !== "admin") throw new Error("Access Denied: Only Admins can create teams");

  const { name, description, managerId, members } = data;

  // 1. Verify the assigned manager is actually a manager role
  const manager = await User.findById(managerId);
  if (!manager || manager.role !== "manager") {
    throw new Error("Invalid Manager ID: Assigned user must have the 'manager' role");
  }

  // 2. Create the team
  const team = await Team.create({
    name,
    description,
    managerId,
    members: members || []
  });

  // 3. 🔄 AUTOMATION: Sync the Executives' managerId field to keep CRM logic intact
  if (members && members.length > 0) {
    await User.updateMany(
      { _id: { $in: members } },
      { $set: { managerId: managerId } }
    );
  }

  return team;
};

// ✅ GET TEAMS (With Automatic RBAC)
export const getTeams = async (user, query = {}) => {
  let filter = { isDeleted: false, ...query };

  if (user.role === "manager") {
    // Managers only see teams they actively manage
    filter.managerId = user._id;
  } else if (user.role === "executive") {
    // Executives only see the specific team(s) they are placed in
    filter.members = user._id;
  }

  return await Team.find(filter)
    .populate("managerId", "name email status")
    .populate("members", "name email status role")
    .sort({ createdAt: -1 });
};

// ✅ GET SINGLE TEAM
export const getTeamById = async (user, teamId) => {
  const team = await Team.findById(teamId)
    .populate("managerId", "name email role status")
    .populate("members", "name email role status");

  if (!team || team.isDeleted) throw new Error("Team not found");

  // 🔐 RBAC Validation
  if (user.role === "manager" && team.managerId._id.toString() !== user._id.toString()) {
    throw new Error("Access Denied: You do not manage this team");
  }
  if (user.role === "executive" && !team.members.some(m => m._id.toString() === user._id.toString())) {
    throw new Error("Access Denied: You are not a member of this team");
  }

  return team;
};

// ✅ UPDATE TEAM DETAILS (Admin Only)
export const updateTeam = async (user, teamId, data) => {
  if (user.role !== "admin") throw new Error("Access Denied: Only Admins can edit core team structures");

  const team = await Team.findById(teamId);
  if (!team || team.isDeleted) throw new Error("Team not found");

  Object.assign(team, data);
  await team.save();

  // 🔄 AUTOMATION: If the manager or members array was changed, resync the User collection
  if (data.managerId || data.members) {
    const currentManager = data.managerId || team.managerId;
    const currentMembers = data.members || team.members;
    
    await User.updateMany(
      { _id: { $in: currentMembers } },
      { $set: { managerId: currentManager } }
    );
  }

  return team;
};

// ✅ ADD MEMBER TO TEAM (Admin & Manager)
export const addTeamMember = async (user, teamId, executiveId) => {
  const team = await getTeamById(user, teamId); // Built-in RBAC check

  if (user.role === "executive") throw new Error("Executives cannot modify team rosters");

  // Verify the user being added is actually an executive
  const execUser = await User.findById(executiveId);
  if (!execUser || execUser.role !== "executive") throw new Error("Only executives can be added as team members");

  if (!team.members.includes(executiveId)) {
    team.members.push(executiveId);
    await team.save();

    // 🔄 AUTOMATION: Instantly sync the Executive's managerId for data waterfalls
    await User.findByIdAndUpdate(executiveId, { managerId: team.managerId._id });
  }

  return team;
};

// ✅ REMOVE MEMBER FROM TEAM (Admin & Manager)
export const removeTeamMember = async (user, teamId, executiveId) => {
  const team = await getTeamById(user, teamId); // Built-in RBAC check

  if (user.role === "executive") throw new Error("Executives cannot modify team rosters");

  team.members = team.members.filter(mId => mId.toString() !== executiveId.toString());
  await team.save();

  // 🔄 AUTOMATION: Clear the Executive's managerId since they are removed
  await User.findByIdAndUpdate(executiveId, { $unset: { managerId: 1 } });

  return team;
};

// ✅ DELETE TEAM (Admin Only)
export const deleteTeam = async (user, teamId) => {
  if (user.role !== "admin") throw new Error("Access Denied: Only Admins can delete teams");

  const team = await Team.findById(teamId);
  if (!team || team.isDeleted) throw new Error("Team not found");

  team.isDeleted = true;
  team.isActive = false;
  await team.save();

  // 🔄 AUTOMATION: Orphan the executives so they can be reassigned later
  await User.updateMany(
    { _id: { $in: team.members } },
    { $unset: { managerId: 1 } }
  );

  return { message: "Team successfully deleted and all members unassigned." };
};