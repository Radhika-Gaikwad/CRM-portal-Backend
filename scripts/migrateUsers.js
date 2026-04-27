import dotenv from "dotenv";
dotenv.config(); // ✅ THIS LINE FIXES EVERYTHING

import mongoose from "mongoose";
import admin from "firebase-admin";
import fs from "fs";
import User from "../src/Model/User.js";

// Load Firebase key
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../src/config/gcs-key.json", import.meta.url))
);

// Init Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

// Debug (optional but useful)
console.log("MONGO_URI:", process.env.MONGO_URI);

// Mongo connection
await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected");

// Migration
const migrateUsers = async () => {
  try {
    const users = await User.find().select("+password").lean();

    console.log(`Migrating ${users.length} users...`);

    for (const user of users) {
      const { _id, ...data } = user;

      await firestore
        .collection("users")
        .doc(_id.toString())
        .set({
          ...data,
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date(),
        });
    }

    console.log("✅ Migration completed");
    process.exit();
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

migrateUsers();