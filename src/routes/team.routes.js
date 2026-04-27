import express from "express";
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  deleteTeam
} from "../controllers/team.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 ALL Team routes are protected and require a valid JWT
router.use(protect);

// 🏢 Core Team Operations
router.post("/", createTeam);               // Admin creates a team
router.get("/", getTeams);                  // Fetches teams based on RBAC
router.get("/:id", getTeamById);            // Get specific team details
router.put("/:id", updateTeam);             // Admin updates team details
router.delete("/:id", deleteTeam);          // Admin soft-deletes a team

// 👥 Team Roster Management
router.post("/:id/members", addTeamMember);               // Add Exec to team
router.delete("/:id/members/:userId", removeTeamMember);  // Remove Exec from team

export default router;