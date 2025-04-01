import { Router } from "express";
import { body, param } from "express-validator";
import * as messageController from "../controllers/message.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// Get all messages for a project
router.get(
  "/:projectId",
  authMiddleware.authUser,
  param("projectId").isMongoId().withMessage("Invalid project ID format"),
  messageController.getMessagesByProject
);

// Create a new message
router.post(
  "/",
  authMiddleware.authUser,
  body("content").notEmpty().withMessage("Message content is required"),
  body("projectId").isMongoId().withMessage("Valid project ID is required"),
  messageController.createMessage
);

// Delete a message
router.delete(
  "/:messageId",
  authMiddleware.authUser,
  param("messageId").isMongoId().withMessage("Invalid message ID format"),
  messageController.deleteMessage
);

// Update a message
router.put(
  "/:messageId",
  authMiddleware.authUser,
  param("messageId").isMongoId().withMessage("Invalid message ID format"),
  body("content").notEmpty().withMessage("Message content is required"),
  messageController.updateMessage
);

export default router;
