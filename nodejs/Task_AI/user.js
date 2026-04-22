const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 100,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const UserModel = mongoose.model("User", userSchema, "users");

class User {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  async register() {
    const existingUser = await UserModel.findOne({ username: this.username });

    if (existingUser) {
      return { success: false, message: "Username already exists" };
    }

    await UserModel.create({
      username: this.username,
      password: this.password,
    });

    return { success: true, message: "User registered successfully" };
  }

  async login() {
    const foundUser = await UserModel.findOne({
      username: this.username,
      password: this.password,
    });

    if (!foundUser) {
      return { success: false, message: "Invalid username or password" };
    }

    return { success: true, user: foundUser, message: "Login successful" };
  }
}

module.exports = User;
