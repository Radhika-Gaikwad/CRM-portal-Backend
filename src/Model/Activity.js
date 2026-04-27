import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Call", "Email", "Meeting", "Note"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // The exact date/time the activity occurred or is scheduled for
    activityDate: {
      type: Date,
      default: Date.now,
    },
    
    // 🔗 POLYMORPHIC RELATIONSHIPS (It will link to ONE of these)
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },

    // 🔐 OWNERSHIP & RBAC
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Denormalized for fast Manager queries (Inherited from the user who performed it)
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for fast dashboard aggregation and RBAC filtering
activitySchema.index({ performedBy: 1, activityDate: -1 });
activitySchema.index({ managerId: 1, activityDate: -1 });
activitySchema.index({ leadId: 1 });
activitySchema.index({ dealId: 1 });
activitySchema.index({ customerId: 1 });

export default mongoose.model("Activity", activitySchema);