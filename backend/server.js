import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
dotenv.config();
import app from "./app.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.projectId;

    if (!projectId) {
      return next(new Error("Project ID is required"));
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid Project ID"));
    }

    try {
      const project = await projectModel.findById(projectId);
      if (project) {
        // Store the project in socket object
        socket.project = project;
      } else {
        // Create a fallback object with the projectId
        socket.project = { _id: projectId };
        console.log(
          `Warning: Project ${projectId} not found but allowing connection`
        );
      }
    } catch (err) {
      console.error(`Error fetching project: ${err.message}`);
      socket.project = { _id: projectId };
    }

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error("Authentication error"));
    }

    socket.user = decoded;
    next();
  } catch (error) {
    console.error(`Socket authentication error: ${error.message}`);
    next(error);
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected");

  // Check if socket.project exists before joining
  if (socket.project && socket.project._id) {
    socket.join(socket.project._id.toString());
    console.log(`Client joined room: ${socket.project._id}`);
  } else {
    console.error("Cannot join room: socket.project._id is undefined");
  }

  socket.on("project-message", async (data) => {
    console.log("Received message:", data);
    if (socket.project && socket.project._id) {
      // Broadcast to all clients in the room except sender
      socket.broadcast
        .to(socket.project._id.toString())
        .emit("project-message", data);

      // You could also save the message to database here if not handled by API
      // This would be an alternative to the frontend API call

      try {
        const newMessage = new messageModel({
          content: data.content,
          projectId: socket.project._id,
          senderId: socket.user._id,
        });
        await newMessage.save();
      } catch (err) {
        console.error("Error saving socket message:", err);
      }
    } else {
      console.error("Cannot broadcast: socket.project._id is undefined");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
