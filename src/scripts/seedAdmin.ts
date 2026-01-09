import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import User from "../models/User";
import logger from "../utils/logger";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info("MongoDB Connected");

    const adminEmail = process.env.ADMIN_EMAIL!;
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      logger.info("Admin user already exists");
      process.exit(0);
    }

    const adminPassword = process.env.ADMIN_PASS || crypto.randomBytes(12).toString("hex");

    const admin = await User.create({
      name: process.env.ADMIN_NAME,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isVerified: true,
    });

    logger.info("Admin user created successfully", {
      id: admin._id,
      email: admin.email,
      password: process.env.ADMIN_PASS
    });

    process.exit(0);
  } catch (error) {
    logger.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
