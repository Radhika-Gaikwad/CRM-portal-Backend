import express from "express";
import {
  toggleClockStatus,
  getDashboardData,
  createAnnouncement
} from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 ALL Dashboard routes require authentication
// The `protect` middleware should verify the token and attach the user to `req.user`
router.use(protect);

// ==========================================
// ⏱️ ATTENDANCE CLOCK
// POST: /api/dashboard/clock
// ==========================================
router.post("/clock", async (req, res) => {
  try {
    // Pass the authenticated user to your controller
    const attendanceRecord = await toggleClockStatus(req.user);
    res.status(200).json(attendanceRecord);
  } catch (error) {
    console.error("Clock-in Error:", error);
    res.status(500).json({ message: "Failed to update attendance status." });
  }
});

// ==========================================
// 📊 GET DASHBOARD DATA
// GET: /api/dashboard/data
// ==========================================
router.get("/data", async (req, res) => {
  try {
    // Pass the authenticated user to fetch role-specific data
    const dashboardPayload = await getDashboardData(req.user);
    res.status(200).json(dashboardPayload);
  } catch (error) {
    console.error("Dashboard Data Error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data." });
  }
});

// ==========================================
// 📢 CREATE ANNOUNCEMENT
// POST: /api/dashboard/announcements
// ==========================================
router.post("/announcements", async (req, res) => {
  try {
    // Pass BOTH the user and the request body (the form data) to your controller
    const newAnnouncement = await createAnnouncement(req.user, req.body);
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error("Announcement Error:", error);
    // If it's an executive trying to post, send a 403 Forbidden
    if (error.message === "Executives cannot broadcast announcements") {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to broadcast announcement." });
  }
});

export default router;