import mongoose from "mongoose";
import messageModel from "../models/message.model.js";

class MessageService {
  /**
   * Get all messages for a specific project
   * @param {Object} params - Parameters
   * @param {string} params.projectId - Project ID
   * @returns {Promise<Array>} - Array of messages
   */
  async getMessagesByProject({ projectId }) {
    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID format");
    }

    // Find messages for the project, sort by creation date
    const messages = await messageModel
      .find({ projectId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email gender");

    return messages;
  }

  /**
   * Create a new message
   * @param {Object} params - Parameters
   * @param {string} params.content - Message content
   * @param {string} params.projectId - Project ID
   * @param {string} params.senderId - Sender user ID
   * @returns {Promise<Object>} - Created message
   */
  async createMessage({ content, projectId, senderId }) {
    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error("Invalid project ID format");
    }

    // Validate senderId
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      throw new Error("Invalid sender ID format");
    }

    // Create new message
    const newMessage = new messageModel({
      content,
      projectId,
      senderId,
    });

    const savedMessage = await newMessage.save();

    // Populate sender info
    const populatedMessage = await messageModel
      .findById(savedMessage._id)
      .populate("senderId", "name email gender");

    return populatedMessage;
  }

  /**
   * Delete a message
   * @param {Object} params - Parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.userId - User ID requesting deletion
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteMessage({ messageId, userId }) {
    // Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new Error("Invalid message ID format");
    }

    // Find message
    const message = await messageModel.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      throw new Error("Not authorized to delete this message");
    }

    // Delete message
    const result = await messageModel.findByIdAndDelete(messageId);
    if (!result) {
      throw new Error("Message deletion failed");
    }

    return { success: true };
  }

  /**
   * Update a message
   * @param {Object} params - Parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.userId - User ID requesting update
   * @param {string} params.content - New content
   * @returns {Promise<Object>} - Updated message
   */
  async updateMessage({ messageId, userId, content }) {
    // Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new Error("Invalid message ID format");
    }

    // Find message
    const message = await messageModel.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      throw new Error("Not authorized to update this message");
    }

    // Update message
    message.content = content;
    await message.save();

    // Return updated message with populated sender
    const updatedMessage = await messageModel
      .findById(messageId)
      .populate("senderId", "name email gender");

    return updatedMessage;
  }

  /**
   * Get message by ID
   * @param {Object} params - Parameters
   * @param {string} params.messageId - Message ID
   * @returns {Promise<Object>} - Message
   */
  async getMessageById({ messageId }) {
    // Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new Error("Invalid message ID format");
    }

    const message = await messageModel
      .findById(messageId)
      .populate("senderId", "name email gender");

    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }
}

export default new MessageService();
