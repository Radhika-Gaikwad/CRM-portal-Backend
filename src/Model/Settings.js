import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // 🏢 General Company Settings
    companyName: { type: String, default: "My CRM Enterprise" },
    currency: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    
    // 📇 Pipeline Customization (Drives frontend dropdown menus)
    leadSources: [
      { type: String, default: ["Website", "Instagram", "Referral", "Direct Call", "Other"] }
    ],
    dealStages: [
      { type: String, default: ["Prospect", "Negotiation", "Won", "Lost"] }
    ],
    accountHealthStatuses: [
      { type: String, default: ["Active", "At Risk", "Churned", "Renewing"] }
    ],

    // ⚙️ Operational Rule Engine (Toggles system features)
    preferences: {
      enableAttendanceTracking: { type: Boolean, default: true },
      enableManagerDealOverride: { type: Boolean, default: true },
      strictLeadPrivacy: { type: Boolean, default: true }, // Execs only see assigned leads
    },

    // 🔒 System Security
    security: {
      sessionTimeoutMinutes: { type: Number, default: 120 },
      requireStrongPasswords: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);