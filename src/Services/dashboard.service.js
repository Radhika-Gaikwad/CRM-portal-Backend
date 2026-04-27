import User from "../Model/User.js";
import Attendance from "../Model/Attendance.js";
import Announcement from "../Model/Announcement.js";
import Lead from "../Model/Lead.js";
import Deal from "../Model/Deal.js";
import Task from "../Model/Task.js";

// ==========================================
// ⏱️ CLOCK-IN / CLOCK-OUT SYSTEM
// ==========================================
export const toggleClockStatus = async (user) => {
  const today = new Date().toISOString().split("T")[0]; // e.g., "2026-04-27"
  
  let attendance = await Attendance.findOne({ userId: user._id, date: today });

  if (!attendance) {
    // First clock-in of the day
    attendance = await Attendance.create({
      userId: user._id,
      managerId: user.managerId,
      date: today,
      status: "Clocked In",
      timeLogs: [{ clockInTime: new Date() }]
    });
    return attendance;
  }

  // If already clocked in, clock them out
  if (attendance.status === "Clocked In") {
    const lastSession = attendance.timeLogs[attendance.timeLogs.length - 1];
    lastSession.clockOutTime = new Date();
    attendance.status = "Clocked Out";
    
    // Calculate minutes worked in this session
    const diffMins = Math.round((lastSession.clockOutTime - lastSession.clockInTime) / 60000);
    attendance.totalWorkMinutes += diffMins;
  } 
  // If clocked out, clock them back in for a new session
  else {
    attendance.status = "Clocked In";
    attendance.timeLogs.push({ clockInTime: new Date() });
  }

  await attendance.save();
  return attendance;
};

// ==========================================
// 📊 DASHBOARD DATA AGGREGATION
// ==========================================
export const getDashboardData = async (user) => {
  const { role, _id } = user;
  const today = new Date().toISOString().split("T")[0];

  // 1. Establish RBAC Filters for Data Querying
  let dataFilter = { isDeleted: false };
  let staffFilter = {}; // For querying who is online
  let announceFilter = { targetAudience: { $in: ["All", role === "manager" ? "Managers" : "Executives"] } };

  if (role === "manager") {
    dataFilter.$or = [{ managerId: _id }, { assignedTo: _id }];
    staffFilter = { managerId: _id };
  } else if (role === "executive") {
    dataFilter.assignedTo = _id;
    staffFilter = { _id: _id }; // Executives only see themselves
  }

  // 2. Execute parallel high-speed database queries
  const [
    myAttendance,
    announcements,
    pendingTasks,
    activeLeadsCount,
    dealsWonCount,
    revenueData,
    staffAttendance
  ] = await Promise.all([
    // A. User's specific attendance for today
    Attendance.findOne({ userId: _id, date: today }),

    // B. Get latest 5 announcements
    Announcement.find(announceFilter).sort({ createdAt: -1 }).limit(5).populate("createdBy", "name"),

    // C. Get urgent tasks due soon
    Task.find({ ...dataFilter, status: { $ne: "Completed" } }).sort({ dueDate: 1 }).limit(10),

    // D. Current Active Leads Pipeline
    Lead.countDocuments({ ...dataFilter, status: { $nin: ["Converted", "Lost"] } }),

    // E. Deals Won
    Deal.countDocuments({ ...dataFilter, stage: "Won" }),

    // F. Revenue Generation
    Deal.aggregate([
      { $match: { ...dataFilter, stage: "Won" } },
      { $group: { _id: null, totalRevenue: { $sum: "$value" } } }
    ]),

    // G. Team/Company Attendance Status (Who is online right now?)
    role === "executive" ? [] : Attendance.find({ date: today, ...staffFilter }).populate("userId", "name role")
  ]);

  // Parse Aggregation Results
  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
  
  // Calculate who is online
  const teamOnline = staffAttendance.filter(a => a.status === "Clocked In").length;
  const totalTeam = role === "admin" ? await User.countDocuments() : await User.countDocuments({ managerId: _id });

  // 3. Construct the Payload tailored to the user's role
  return {
    personal: {
      clockStatus: myAttendance ? myAttendance.status : "Clocked Out",
      workedMinutesToday: myAttendance ? myAttendance.totalWorkMinutes : 0,
    },
    metrics: {
      activeLeads: activeLeadsCount,
      dealsWon: dealsWonCount,
      revenue: totalRevenue,
      teamOnline: `${teamOnline} / ${totalTeam} Staff Online`,
    },
    actionItems: {
      pendingTasks,
      recentAnnouncements: announcements,
    },
    // Include full team attendance roster for Admins and Managers
    teamRoster: role !== "executive" ? staffAttendance.map(a => ({
      name: a.userId.name,
      role: a.userId.role,
      status: a.status,
      minutesWorked: a.totalWorkMinutes
    })) : undefined
  };
};

// ==========================================
// 📢 ANNOUNCEMENT MANAGEMENT (Admins/Managers)
// ==========================================
export const createAnnouncement = async (user, data) => {
  if (user.role === "executive") throw new Error("Executives cannot broadcast announcements");
  
  return await Announcement.create({
    ...data,
    createdBy: user._id
  });
};