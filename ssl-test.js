// ssl-test.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testSSLConnection = async () => {
  try {
    console.log("🔍 Testing SSL MongoDB connection...");
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      tls: true,
      retryWrites: true,
    });
    
    console.log("✅ SSL Connection successful!");
    console.log("🏠 Host:", conn.connection.host);
    console.log("📊 Database:", conn.connection.name);
    console.log("🔒 SSL Status: Enabled");
    
    // Test a simple operation
    const admin = conn.connection.db.admin();
    const result = await admin.ping();
    console.log("🏓 Database ping successful:", result);
    
    await mongoose.connection.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ SSL Connection failed:", error.message);
    
    if (error.message.includes('IP')) {
      console.error("🚨 IP WHITELIST ISSUE: Add your IP to MongoDB Atlas Network Access");
    }
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error("🚨 SSL/TLS ISSUE: Check your connection string and SSL settings");
    }
    
    console.error("❌ Error code:", error.code);
    process.exit(1);
  }
};

testSSLConnection();