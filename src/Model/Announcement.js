import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetAudience: { 
      type: String, 
      enum: ["All", "Managers", "Executives"], 
      default: "All" 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isImportant: { type: Boolean, default: false }, // If true, shows up with a red alert badge
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);