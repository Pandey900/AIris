import * as userService from "../services/user.service.js";
import { validationResult } from "express-validator";
import userModel from "../models/user.model.js";
import redisClient from "../services/redis.service.js";

export const createUserController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    // Check if gender is provided
    const { email, password, gender } = req.body;

    if (!gender) {
      return res.status(400).json({ error: "Gender is required" });
    }

    // Validate gender value
    if (!["male", "female"].includes(gender.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "Invalid gender value. Must be 'male' or 'female'" });
    }

    // Pass complete user data to service
    const user = await userService.createUser({
      email,
      password,
      gender: gender.toLowerCase(), // Ensure consistent casing
    });

    const token = await user.generateJWT();
    delete user._doc.password;
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const loginUserController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }
    const token = await user.generateJWT();
    delete user._doc.password;
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const profileUserController = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({
      user: {
        email: user.email,
        gender: user.gender,
        _id: user._id,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProfileController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { gender } = req.body;
    const updateData = {};

    if (gender) {
      if (!["male", "female"].includes(gender.toLowerCase())) {
        return res
          .status(400)
          .json({ error: "Invalid gender value. Must be 'male' or 'female'" });
      }
      updateData.gender = gender.toLowerCase();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { email: req.user.email },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        email: updatedUser.email,
        gender: updatedUser.gender,
        _id: updatedUser._id,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const logoutController = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];
    redisClient.set(token, "logout", "EX", 60 * 60 * 24);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    if (!loggedInUser) {
      return res.status(401).json({ error: "User not found" });
    }
    const allUsers = await userService.getAllUsers({
      userId: loggedInUser._id,
    });
    return res.status(200).json({ users: allUsers });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateGenderController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { gender } = req.body;

    if (!gender) {
      return res.status(400).json({ error: "Gender is required" });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { email: req.user.email },
      { gender: gender.toLowerCase() },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        email: updatedUser.email,
        gender: updatedUser.gender,
        _id: updatedUser._id,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
