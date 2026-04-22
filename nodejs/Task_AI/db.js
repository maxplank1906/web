const mongoose = require("mongoose");

const MONGO_URI = "mongodb://127.0.0.1:27017/studentDB";

async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected to studentDB");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;
