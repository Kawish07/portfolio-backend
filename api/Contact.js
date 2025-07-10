import connectDB from "../connectDB.js";
import Contact from "../models/Contact.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await connectDB();

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const newContact = new Contact({ 
      name: name.trim(), 
      email: email.trim(), 
      message: message.trim() 
    });
    
    await newContact.save();

    res.status(201).json({ 
      success: true, 
      message: "Contact form submitted successfully" 
    });
  } catch (err) {
    console.error("❌ Contact API error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error. Please try again later." 
    });
  }
}
