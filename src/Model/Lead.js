import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ["Instagram", "Website", "Referral", "Direct Call", "Other"],
      default: "Website",
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Qualified", "Converted", "Lost"],
      default: "New",
    },
   assignedTo: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
}],
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The manager overseeing it
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Who assigned it last
    },
    dealValue: {
      type: Number,
      default: 0,
    },
    expectedCloseDate: {
      type: Date,
    },
    notes: [
      {
        text: { type: String },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    activities: [
      {
        type: {
          type: String,
          enum: ["Call", "Email", "Meeting", "Note"],
        },
        description: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["New", "Contacted", "Qualified", "Converted", "Lost"],
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Lead", leadSchema);