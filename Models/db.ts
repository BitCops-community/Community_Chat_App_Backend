import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const { MONGODB_URL } = process.env;

const ConnectToDB = async () => {
  try {
    await mongoose.connect(MONGODB_URL!);
    console.log("MongoDB connected");
  } catch (error) {
    console.log(`Error connecting to MongoDB`);
    error instanceof Error
      ? console.log(error.message)
      : console.log(`Error connecting to MongoDB ${error}`);
  }
};

export default ConnectToDB;
