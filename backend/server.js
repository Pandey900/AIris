import http from "http";
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import redisClient from "./services/redis.service.js";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import Message from "./models/message.model.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Helper function to save a message to the database
async function saveMessage(messageData) {
  try {
    const newMessage = new Message({
      projectId: messageData.projectId,
      sender: messageData.sender,
      senderName: messageData.senderName,
      senderEmail: messageData.senderEmail,
      senderGender: messageData.senderGender,
      message: messageData.message,
      timestamp: messageData.timestamp || new Date(),
    });

    return await newMessage.save();
  } catch (error) {
    console.error("Error saving message:", error);
    return null;
  }
}

// Helper function to load previous messages
async function loadPreviousMessages(projectId, limit = 50) {
  try {
    return await Message.find({ projectId })
      .sort({ createdAt: 1 }) // Oldest to newest
      .limit(limit)
      .lean();
  } catch (error) {
    console.error("Error loading messages:", error);
    return [];
  }
}

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.projectId;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid Project ID format"));
    }

    socket.project = await projectModel.findById(projectId);
    if (!socket.project) {
      return next(new Error("Project not found"));
    }

    if (!token) {
      return next(new Error("Unauthorized User"));
    }
    const isBlackListed = await redisClient.get(token);
    if (isBlackListed) {
      return next(new Error("Unauthorized User"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error("Unauthorized User"));
    }
    socket.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
});

io.on("connection", (socket) => {
  socket.roomId = socket.project._id.toString();

  console.log("New client connected");
  console.log(socket.project._id.toString());
  socket.join(socket.roomId);

  // Send previous messages when user connects
  (async () => {
    try {
      const messages = await loadPreviousMessages(socket.project._id);
      if (messages.length > 0) {
        socket.emit("previous-messages", messages);
      }
    } catch (err) {
      console.error("Error loading previous messages:", err);
    }
  })();

  // Modified to save messages to database
  socket.on("project-message", async (data) => {
    try {
      // Add project ID to the message data
      const messageWithProjectId = {
        ...data,
        projectId: socket.project._id,
      };

      // Save to database
      await saveMessage(messageWithProjectId);

      // Broadcast to others
      socket.broadcast.to(socket.roomId).emit("project-message", data);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  socket.on("event", (data) => {
    /* … */
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    socket.leave(socket.roomId);
    socket.to(socket.roomId).emit("user-disconnected", {
      message: "A user has disconnected",
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
