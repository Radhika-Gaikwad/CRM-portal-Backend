import express from "express";
import {
  getDashboardMetrics,
  getSalesPipelineReport,
  getTeamPerformanceReport
} from "../controllers/report.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 ALL report routes require authentication
router.use(protect);

// Dashboards & Analytics
router.get("/metrics", getDashboardMetrics);
router.get("/pipeline", getSalesPipelineReport);
router.get("/performance", getTeamPerformanceReport);

export default router;