import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: [3, "Name must be at least 3 characters long"],
    maxLength: [50, "Name must be at most 50 characters long"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: [6, "Email must be at least 6 characters long"],
    maxLength: [50, "Email must be at most 50 characters long"],
  },
  password: {
    type: String,
    required: true,
    select: false,
    minLength: [3, "Password must be at least 3 characters long"],
  },
  gender: {
    type: String,
    required: true,
    enum: {
      values: ["male", "female"],
      message: "Invalid gender",
    },
  },
});

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};
userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateJWT = function () {
  return jwt.sign({ email: this.email }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

const User = mongoose.model("user", userSchema);
export default User;
