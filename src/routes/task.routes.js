import express from "express";
import {
  createTask,
  getTasks,
  updateTaskStatus,
  updateTaskDetails,
  deleteTask,
} from "../controllers/task.controller.js";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply the protect middleware to all routes in this file
router.use(protect);

// Get all tasks (Controller handles the role-based filtering)
router.get("/", getTasks);

// Update just the status (Executives CAN do this)
router.put("/:id/status", updateTaskStatus);

// Create a task (Admin/Manager only - blocked in service layer)
router.post("/", authorizeRoles("admin", "manager"), createTask);

// Update core task details (Admin/Manager only)
router.put("/:id", authorizeRoles("admin", "manager"), updateTaskDetails);

// Delete a task (Admin/Manager only)
router.delete("/:id", authorizeRoles("admin", "manager"), deleteTask);

export default router;