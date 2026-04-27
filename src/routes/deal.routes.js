import express from "express";
import {
  createDeal,
  getDeals,
  getDealById,
  updateDealStage,
  updateDealDetails,
  deleteDeal,
  addDealNote
} from "../controllers/deal.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All deal routes require authentication
router.use(protect);

router.post("/", createDeal);
router.get("/", getDeals);
router.get("/:id", getDealById);

// Quick status updates (Kanban drag-and-drop)
router.put("/:id/stage", updateDealStage);

// Full details update
router.put("/:id", updateDealDetails);
router.delete("/:id", deleteDeal);

// Adding notes to the deal
router.post("/:id/note", addDealNote);

export default router;