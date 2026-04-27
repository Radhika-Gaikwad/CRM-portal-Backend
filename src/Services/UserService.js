import User from "../Model/User.js"; // Note: adjusted path to match standard lowercase "models"
import bcrypt from "bcryptjs";

export const createUser = async (data) => {
  const { name, email, password, role } = data;

  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  // ✅ Auto-approve if the role is 'admin' (or explicitly your admin email)
  const initialStatus = role === "admin" ? "active" : "pending";

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    status: initialStatus, // Overrides the "pending" default for admins
  });

  return user;
};

export const loginUser = async (email, password) => {
  // 1️⃣ THE MASTER ADMIN BYPASS
  // If the credentials match exactly, skip the database and return a mock user object.
  if (email === "admin@crm.com" && password === "Admin@123") {
    return {
    _id: "000000000000000000000000",
      name: "Master Admin",
      email: "admin@crm.com",
      role: "admin",
      status: "active"
    };
  }

  // 2️⃣ STANDARD USER LOGIN FLOW
  // If it's not the admin, check the database normally.
  const user = await User.findOne({ email });

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new Error("Invalid credentials");

  // 3️⃣ STATUS CHECKS FOR REGULAR USERS
  if (user.status === "pending") {
    throw new Error("Your account is pending admin approval.");
  }
  if (user.status === "inactive") {
    throw new Error("Your account has been deactivated. Please contact admin.");
  }

  return user;
};

export const getAllUsers = async () => {
  // ✅ Populate managerId so the Admin table can show assigned managers
  return await User.find()
    .populate("managerId", "name email")
    .select("-password")
    .sort({ createdAt: -1 });
};

export const updateUser = async (id, data) => {
  return await User.findByIdAndUpdate(id, data, { new: true }).populate("managerId", "name email");
};

export const deleteUser = async (id) => {
  return await User.findByIdAndDelete(id);
};