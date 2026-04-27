import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For fast manager querying
    date: { type: String, required: true }, // Format: YYYY-MM-DD for exact daily tracking
    status: { 
      type: String, 
      enum: ["Clocked In", "Clocked Out", "On Break"], 
      default: "Clocked Out" 
    },
    // Array of work sessions for the day
    timeLogs: [
      {
        clockInTime: { type: Date, required: true },
        clockOutTime: { type: Date },
      }
    ],
    totalWorkMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for fast daily and team-based lookups
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ managerId: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);