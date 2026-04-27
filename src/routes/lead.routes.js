import express from "express";
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus,
  addNote,
  addActivity,
} from "../controllers/lead.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getLeads);
router.get("/:id", protect, getLeadById);
router.post("/", protect, createLead);
router.put("/:id", protect, updateLead);
router.delete("/:id", protect, deleteLead);
router.put("/:id/assign", protect, assignLead);
router.put("/:id/status", protect, updateLeadStatus);
router.post("/:id/note", protect, addNote); // Handles both create and edit via body.noteId
router.post("/:id/activity", protect, addActivity);

export default router;