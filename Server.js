import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Initialize environment variables first
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "10kb" }));

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    // Add connection options for better reliability
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      tls: true,
      retryWrites: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    
    // More detailed error logging
    if (error.reason) {
      console.error(`❌ Error reason: ${error.reason}`);
    }
    if (error.code) {
      console.error(`❌ Error code: ${error.code}`);
    }
    
    throw error; // Re-throw to handle in startServer
  }
};

// Connection event handlers
mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🟡 Mongoose disconnected from MongoDB Atlas");
});

// Reconnection logic
mongoose.connection.on("reconnected", () => {
  console.log("🔄 Mongoose reconnected to MongoDB Atlas");
});

// Contact Form Route
import Contact from "./models/Contact.js";

app.post("/api/contact", async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: "Database connection unavailable" 
      });
    }

    // Input validation
    if (!req.body.name || !req.body.email || !req.body.message) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    const newContact = new Contact({
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      message: req.body.message.trim()
    });

    await newContact.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Contact form submitted successfully" 
    });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error. Please try again later." 
    });
  }
});

// Health check endpoint with more details
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  res.status(200).json({ 
    status: "OK",
    database: statusMap[dbStatus] || "unknown",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Endpoint not found" 
  });
});

// Server startup with retry logic
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  let retries = 3;
  
  while (retries > 0) {
    try {
      console.log(`🔄 Attempting to connect to MongoDB Atlas... (${4 - retries}/3)`);
      await connectDB();
      
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      });
      
      break; // Success, exit retry loop
    } catch (err) {
      retries--;
      console.error(`❌ Failed to start server: ${err.message}`);
      
      if (retries === 0) {
        console.error("❌ Max retries reached. Exiting...");
        process.exit(1);
      }
      
      console.log(`🔄 Retrying in 5 seconds... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await mongoose.connection.close();
    console.log("✅ Mongoose connection closed due to app termination");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});

// Start the application
startServer();