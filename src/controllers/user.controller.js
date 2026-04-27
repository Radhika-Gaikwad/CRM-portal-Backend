import * as userService from "../services/userService.js";
import generateToken from "../utils/generateToken.js";
import User from "../Model/User.js";

export const register = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    
    // ✅ Do NOT generate a token here anymore. They must wait for approval.
    res.status(201).json({ 
      message: "Registration successful. Please wait for admin approval before logging in.", 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const user = await userService.loginUser(req.body.email, req.body.password);
    res.json({ message: "Login successful", token: generateToken(user), user });
  } catch (error) {
    // Returns 401 for bad credentials, pending, or inactive status
    res.status(401).json({ message: error.message }); 
  }
};

export const getUsers = async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
};

export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.json({ message: "User deleted" });
};

export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};
    if (role) filter.role = role;
    
    // ✅ Added populate here too, so assignment modals can show current managers
    const users = await User.find(filter).populate("managerId", "name email").select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTeam = async (req, res) => {
  try {
    const managerId = req.user._id;
    const executives = await User.find({
      role: "executive",
      managerId: managerId,
    }).select("name email status"); // Ensure manager only sees their team
    res.json(executives);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW: Admin Approve/Reject User
export const approveUser = async (req, res) => {
  try {
    const { status } = req.body; // Expects "active" or "inactive"
    const user = await userService.updateUser(req.params.id, { status });
    res.json({ message: `User status updated to ${status}`, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ NEW: Admin Assign Executive to Manager
export const assignManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    
    // Optional: Validate that the requested manager actually exists and is a manager
    if (managerId) {
      const manager = await User.findOne({ _id: managerId, role: "manager" });
      if (!manager) return res.status(400).json({ message: "Invalid manager selected." });
    }

    const user = await userService.updateUser(req.params.id, { managerId: managerId || null });
    res.json({ message: "Executive successfully assigned to manager.", user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};