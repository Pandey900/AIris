import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true, // Add index for faster queries by projectId
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Add compound index for better query performance
messageSchema.index({ projectId: 1, createdAt: 1 });

const messageModel = mongoose.model("Message", messageSchema);
export default messageModel;
