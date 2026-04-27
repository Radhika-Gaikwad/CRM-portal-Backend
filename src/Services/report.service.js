import Lead from "../Model/Lead.js";
import Deal from "../Model/Deal.js";
import Customer from "../Model/Customer.js";
import Activity from "../Model/Activity.js";

// ==========================================
// 🔐 HELPER: RBAC FILTER GENERATOR
// ==========================================
// Generates the base query filter depending on if it's an Admin or Manager
const getBaseFilter = (user) => {
  if (user.role === "admin") return { isDeleted: false };
  if (user.role === "manager") return { managerId: user._id, isDeleted: false };
  throw new Error("Access Denied: Executives do not have access to Analytics");
};

// ==========================================
// 📊 1. HIGH-LEVEL DASHBOARD METRICS
// ==========================================
export const getDashboardMetrics = async (user) => {
  const baseFilter = getBaseFilter(user);

  // 1. Get Total Leads
  const totalLeads = await Lead.countDocuments(baseFilter);

  // 2. Get Total Customers
  const totalCustomers = await Customer.countDocuments(baseFilter);

  // 3. Calculate Conversion Rate
  const conversionRate = totalLeads > 0 ? ((totalCustomers / totalLeads) * 100).toFixed(2) : 0;

  // 4. Get Total Revenue (Sum of all Won Deals)
  const revenueAggregation = await Deal.aggregate([
    { $match: { ...baseFilter, stage: "Won" } },
    { $group: { _id: null, totalRevenue: { $sum: "$value" } } }
  ]);
  const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

  return {
    totalLeads,
    totalCustomers,
    conversionRate: `${conversionRate}%`,
    totalRevenue
  };
};

// ==========================================
// 📈 2. SALES PIPELINE REPORT
// ==========================================
export const getSalesPipelineReport = async (user) => {
  const baseFilter = getBaseFilter(user);

  // Group deals by their current stage to see where money is stuck
  const pipeline = await Deal.aggregate([
    { $match: baseFilter },
    { 
      $group: { 
        _id: "$stage", 
        count: { $sum: 1 }, 
        totalValue: { $sum: "$value" } 
      } 
    },
    { $sort: { totalValue: -1 } }
  ]);

  return pipeline;
};

// ==========================================
// 👥 3. TEAM PERFORMANCE REPORT
// ==========================================
export const getTeamPerformanceReport = async (user) => {
  const baseFilter = getBaseFilter(user);

  // 1. Get Deals closed per Executive
  const dealsClosed = await Deal.aggregate([
    { $match: { ...baseFilter, stage: "Won" } },
    // Unwind assignedTo because it's an array
    { $unwind: "$assignedTo" },
    { 
      $group: { 
        _id: "$assignedTo", 
        dealsWon: { $sum: 1 }, 
        revenueGenerated: { $sum: "$value" } 
      } 
    },
    // Lookup to get the executive's actual name instead of just their ID
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "executiveDetails"
      }
    },
    { $unwind: "$executiveDetails" },
    {
      $project: {
        executiveName: "$executiveDetails.name",
        dealsWon: 1,
        revenueGenerated: 1
      }
    },
    { $sort: { revenueGenerated: -1 } }
  ]);

  // 2. Get Activities logged per Executive (Hustle Metric)
  const activitiesLogged = await Activity.aggregate([
    { $match: baseFilter },
    { 
      $group: { 
        _id: "$performedBy", 
        calls: { $sum: { $cond: [{ $eq: ["$type", "Call"] }, 1, 0] } },
        meetings: { $sum: { $cond: [{ $eq: ["$type", "Meeting"] }, 1, 0] } },
        emails: { $sum: { $cond: [{ $eq: ["$type", "Email"] }, 1, 0] } }
      } 
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "executiveDetails"
      }
    },
    { $unwind: "$executiveDetails" },
    {
      $project: {
        executiveName: "$executiveDetails.name",
        calls: 1,
        meetings: 1,
        emails: 1
      }
    }
  ]);

  return { dealsClosed, activitiesLogged };
};