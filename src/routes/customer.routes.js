import express from "express";
import {
  getCustomers,
  getCustomerById,
  addCustomerNote,
  logSupportCall,
  updateAccountStatus
} from "../controllers/customer.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 ALL customer routes require authentication
router.use(protect);

// Fetching Data (Filtered automatically by role in the service)
router.get("/", getCustomers);
router.get("/:id", getCustomerById);

// Post-Sale Actions (Executive / Manager)
router.post("/:id/note", addCustomerNote);
router.post("/:id/support", logSupportCall);

// Account Management (Manager / Admin)
router.put("/:id/status", updateAccountStatus);

export default router;