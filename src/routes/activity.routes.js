import express from "express";
import {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} from "../controllers/activity.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 ALL activity routes require authentication
router.use(protect);

// Standard CRUD Operations
router.post("/", createActivity);
router.get("/", getActivities);
router.get("/:id", getActivityById);
router.put("/:id", updateActivity);
router.delete("/:id", deleteActivity);

export default router;