import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    // Inherited Contact Info
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true },
    company: { type: String, trim: true },
    
    // Account Health (Manager focus)
    accountStatus: {
      type: String,
      enum: ["Active", "At Risk", "Churned", "Renewing"],
      default: "Active",
    },
    
    // Financial Tracking (Admin/Manager focus)
    lifetimeValue: { type: Number, default: 0 },
    
    // System Linkages
    originalLeadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    purchaseHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
    
    // Ownership & Visibility (RBAC)
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Executives
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },    // Overseeing Manager
    
    // Executive Post-Sale Operations
    notes: [
      {
        text: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    supportLogs: [
      {
        issueSummary: { type: String, required: true },
        resolution: { type: String },
        status: { type: String, enum: ["Open", "Resolved"], default: "Open" },
        loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        loggedAt: { type: Date, default: Date.now },
      }
    ],
    
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for fast dashboard loading based on roles
customerSchema.index({ assignedTo: 1, accountStatus: 1 });
customerSchema.index({ managerId: 1, accountStatus: 1 });

export default mongoose.model("Customer", customerSchema);