import express from "express";
import {
  register,
  login,
  getUsers,
  updateUser,
  deleteUser,
  getUsersByRole,
  getMyTeam,
  approveUser,
  assignManager
} from "../controllers/user.controller.js";

import { protect, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.post("/register", register);
router.post("/login", login);

// Protected Lookups
router.get("/by-role", protect, getUsersByRole);

// Admin only User Management
router.get("/", protect, authorizeRoles("admin"), getUsers);
router.put("/:id", protect, authorizeRoles("admin"), updateUser);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

// ✅ Admin only: User Approval & Assignment Endpoints
router.put("/:id/approve", protect, authorizeRoles("admin"), approveUser);
router.put("/:id/assign-manager", protect, authorizeRoles("admin"), assignManager);

// Manager specific route
router.get("/my-team", protect, authorizeRoles("admin", "manager"), getMyTeam);

export default router;