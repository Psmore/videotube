import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectDB = async function () {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\nMongoDB connected !! MongoDB HOST: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDB connection failed !!", error);
        process.exit(1);
    }
};
export default connectDB;
