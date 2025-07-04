// connectDB.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Remove deprecated options and add modern ones
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    
    // Log more detailed error information
    if (error.reason) {
      console.error(`❌ Error reason: ${error.reason}`);
    }
    
    process.exit(1);
  }
};

export default connectDB;