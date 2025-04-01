import messageService from "../services/message.service.js";
import userModel from "../models/user.model.js";
import { validationResult } from "express-validator";
import mongoose from "mongoose";

// Helper function to get user ID from email
async function getUserIdFromEmail(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  if (!req.user || !req.user.email) {
    throw new Error("Authentication error - missing user email");
  }

  try {
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) {
      throw new Error("User not found");
    }
    return user._id;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw new Error("Failed to authenticate user");
  }
}

// ✅ Get all messages for a project
export const getMessagesByProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const messages = await messageService.getMessagesByProject({ projectId });
    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Create a new message
export const createMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { projectId, content } = req.body;

    // Authenticate user using email
    const senderId = await getUserIdFromEmail(req);

    const message = await messageService.createMessage({
      content,
      projectId,
      senderId,
    });

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a message
export const deleteMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID format" });
    }

    // Authenticate user using email
    const userId = await getUserIdFromEmail(req);

    await messageService.deleteMessage({ messageId, userId });

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Update a message
export const updateMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID format" });
    }

    // Authenticate user using email
    const userId = await getUserIdFromEmail(req);

    const updatedMessage = await messageService.updateMessage({
      messageId,
      userId,
      content,
    });

    return res.status(200).json({ message: updatedMessage });
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({ message: error.message });
  }
};
