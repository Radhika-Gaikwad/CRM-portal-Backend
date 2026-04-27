import * as reportService from "../Services/report.service.js";

// Ensure the user is an Admin or Manager before hitting the service
const checkReportAccess = (role) => {
  if (role === "executive") {
    throw new Error("Access Denied: Executives are not authorized to view system reports.");
  }
};

export const getDashboardMetrics = async (req, res) => {
  try {
    checkReportAccess(req.user.role);
    const metrics = await reportService.getDashboardMetrics(req.user);
    res.status(200).json(metrics);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const getSalesPipelineReport = async (req, res) => {
  try {
    checkReportAccess(req.user.role);
    const pipeline = await reportService.getSalesPipelineReport(req.user);
    res.status(200).json(pipeline);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const getTeamPerformanceReport = async (req, res) => {
  try {
    checkReportAccess(req.user.role);
    const performance = await reportService.getTeamPerformanceReport(req.user);
    res.status(200).json(performance);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};