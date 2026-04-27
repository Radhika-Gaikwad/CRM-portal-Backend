import jwt from "jsonwebtoken";
import User from "../Model/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 1️⃣ THE MASTER ADMIN BYPASS (Middleware level)
      // Check if the token belongs to our hardcoded admin
      // Note: check both 'id' and '_id' depending on how generateToken is written
      const tokenId = decoded.id || decoded._id;
      if (tokenId === "000000000000000000000000") {
        req.user = {
          _id: "000000000000000000000000", // ✅ Valid Mongoose ID format
          name: "Master Admin",
          email: "admin@crm.com",
          role: "admin",
          status: "active"
        };
        return next();
      }

      // 2️⃣ STANDARD USER FLOW
      req.user = await User.findById(tokenId).select("-password");

      // Make sure the user actually still exists in the database
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error("Auth Error:", error.message); // Helpful for debugging
      return res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Added a safety check for req.user
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};