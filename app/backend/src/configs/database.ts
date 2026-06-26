import mongoose from "mongoose";
import { MONGODB_URL, MONGODB_TEST_URL } from "../constants/constant";

let isConnected = false;

export const connectToMongoDB = async () => {
  if (isConnected) return;

  const uri = String(MONGODB_URL);
  if (!uri || typeof uri !== "string") {
    throw new Error(`Invalid MONGODB_URL: expected string, got ${typeof MONGODB_URL}`);
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

export const connectDB = connectToMongoDB;

export const connectToMongoDBTest = async () => {
  if (isConnected) return;

  const uri = String(MONGODB_TEST_URL);
  if (!uri || typeof uri !== "string") {
    throw new Error(`Invalid MONGODB_TEST_URL: expected string, got ${typeof MONGODB_TEST_URL}`);
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("Connected to MongoDB Test");
  } catch (error) {
    console.error("Error connecting to MongoDB Test:", error);
    throw error;
  }
};
