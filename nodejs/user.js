const mongoose = require("mongoose");

// MongoDB schema for users
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const UserModel = mongoose.model("User", userSchema);

// The User CLASS your instructor asked for
class User {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  async register() {
    const newUser = new UserModel({
      username: this.username,
      password: this.password,
    });
    await newUser.save();
    return "User registered successfully";
  }

  async login() {
    const found = await UserModel.findOne({
      username: this.username,
      password: this.password,
    });
    return found ? found : null;
  }
}

module.exports = User;