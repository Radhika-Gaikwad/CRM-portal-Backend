import dotenv from "dotenv";
dotenv.config(); // Must be at the very top

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

// Route Imports
import userRoutes from "./routes/user.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import taskRoutes from "./routes/task.routes.js";
import dealRoutes from "./routes/deal.routes.js";
// ✅ 1. Import the new customer routes
import customerRoutes from "./routes/customer.routes.js"; 
import activityRoutes from "./routes/activity.routes.js";
import reportRoutes from "./routes/report.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import teamRoutes from "./routes/team.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import seedAdmin from "./utils/seedAdmin.js";

const app = express();

// ✅ FLEXIBLE CORS: Allows both 5173 and 5174
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Database Connection
connectDB().then(() => {
  console.log("Database initialized...");
  seedAdmin();
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/deals", dealRoutes);
// ✅ 2. Mount the customer routes to the /api/customers endpoint
app.use("/api/customers", customerRoutes); 
app.use("/api/activities", activityRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/settings", settingsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});