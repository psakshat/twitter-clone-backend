import mongoose from "mongoose";
import { ENV } from "./env.js";
export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log("Database Connected Succesfully!!!");
    return;
  } catch (error) {
    console.log("Error connectiong to MONGODB", error);
    process.exit(1);
  }
};
