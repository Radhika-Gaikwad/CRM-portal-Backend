import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true,
      unique: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    // The single manager who owns this team
    managerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    // The executives belonging to this team
    members: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      }
    ],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isDeleted: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

// Indexes for lightning-fast RBAC lookups
teamSchema.index({ managerId: 1, isDeleted: 1 });
teamSchema.index({ members: 1, isDeleted: 1 });

export default mongoose.model("Team", teamSchema);