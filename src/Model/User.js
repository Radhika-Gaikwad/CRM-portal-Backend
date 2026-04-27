import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "executive"],
      default: "executive",
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive"], // ✅ Added "pending"
      default: "pending", // ✅ Default is now pending
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);