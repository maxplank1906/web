const mongoose = require("mongoose");

const MONGO_URI = "mongodb://127.0.0.1:27017/studentDB";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB!");
    runApp();
  })
  .catch((err) => {
    console.error("❌ Failed to connect:", err.message);
  });

const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  course: String,
});

const Student = mongoose.model("Student", studentSchema);

async function runApp() {
  const student = await Student.create({
    name: "Ali Hassan",
    age: 21,
    course: "Computer Science",
  });
  console.log("📌 Student added:", student);

  const all = await Student.find();
  console.log("📋 All students:", all);

  mongoose.connection.close();
  console.log("🔌 Connection closed.");
}