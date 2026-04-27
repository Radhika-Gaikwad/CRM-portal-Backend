import User from "../Model/User.js";
import bcrypt from "bcryptjs";

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@crm.com" });

    if (adminExists) {
      console.log("✅ Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await User.create({
      name: "Admin User",
      email: "admin@crm.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("🔥 Default Admin Created:");
    console.log({
      email: admin.email,
      password: "Admin@123",
    });

  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
  }
};

export default seedAdmin;