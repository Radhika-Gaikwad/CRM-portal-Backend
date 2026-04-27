import express from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 ALL Settings routes require a valid JWT
router.use(protect);

// ⚙️ System Configuration
router.get("/", getSettings);          // Admin fetches the config
router.put("/", updateSettings);       // Admin saves new config preferences

export default router;