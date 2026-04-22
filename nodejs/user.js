const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const UserModel = mongoose.model("User", userSchema, "users");

class User {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  async register() {
    const existingUser = await UserModel.findOne({ username: this.username });

    if (existingUser) {
      return "Username already exists";
    }

    const newUser = new UserModel({
      username: this.username,
      password: this.password,
    });

    await newUser.save();
    return "User registered successfully";
  }

  async login() {
    const foundUser = await UserModel.findOne({
      username: this.username,
      password: this.password,
    });

    return foundUser;
  }
}

module.exports = User;