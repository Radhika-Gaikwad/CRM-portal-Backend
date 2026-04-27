import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    stage: {
      type: String,
      enum: ["Prospect", "Negotiation", "Won", "Lost"],
      default: "Prospect",
    },
    expectedCloseDate: {
      type: Date,
      required: true,
    },
    // The lead/customer this deal belongs to
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    // Which executives are working this deal
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    // The manager overseeing the executives
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Who created the deal in the system
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    notes: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Indexes for fast dashboard loading
dealSchema.index({ assignedTo: 1, stage: 1 });
dealSchema.index({ managerId: 1, stage: 1 });
dealSchema.index({ leadId: 1 });

export default mongoose.model("Deal", dealSchema);