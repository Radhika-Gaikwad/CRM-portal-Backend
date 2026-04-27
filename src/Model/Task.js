import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    taskType: { 
      type: String, 
      enum: ["Call", "Email", "Meeting", "To-Do", "Follow-up"], 
      default: "To-Do" 
    },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    dueDate: { type: Date, required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    
    // ✅ CHANGED to Array to support multiple executives
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ leadId: 1 });

export default mongoose.model("Task", taskSchema);