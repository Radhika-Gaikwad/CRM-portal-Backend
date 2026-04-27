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
      timeLogs: [{ clockInTime: new Date() }] // STORES EXACT CLOCK IN TIME
    });
    return attendance;
  }

  // If already clocked in, clock them out
  if (attendance.status === "Clocked In") {
    const lastSession = attendance.timeLogs[attendance.timeLogs.length - 1];
    lastSession.clockOutTime = new Date(); // STORES EXACT CLOCK OUT TIME
    attendance.status = "Clocked Out";
    
    // Calculate minutes worked in this session
    const diffMins = Math.round((lastSession.clockOutTime - lastSession.clockInTime) / 60000);
    attendance.totalWorkMinutes += diffMins;
  } 
  // If clocked out, clock them back in for a new session
  else {
    attendance.status = "Clocked In";
    attendance.timeLogs.push({ clockInTime: new Date() }); // STORES RE-ENTRY TIME
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
      timeLogs: myAttendance ? myAttendance.timeLogs : [] // Passed to frontend so you can verify tracking
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
    // Fix applied here: Optional chaining (?.) to prevent crashes on deleted users
    teamRoster: role !== "executive" ? staffAttendance.map(a => ({
      name: a.userId?.name || "Deleted User", 
      role: a.userId?.role || "N/A",
      status: a.status,
      minutesWorked: a.totalWorkMinutes,
      timeLogs: a.timeLogs // Added exact clock-in/out logs for verification
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