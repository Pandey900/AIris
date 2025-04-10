import projectModel from "../models/project.model.js";
import * as projectService from "../services/project.service.js";
import userModel from "../models/user.model.js";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
export const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const userId = loggedInUser._id;
    const newProject = await projectService.createProject({ name, userId });
    res.status(201).json(newProject);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

export const getAllProject = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const userId = loggedInUser._id;
    const allUserProjects = await projectService.getAllProjectByUserId({
      userId,
    });
    return res.status(200).json({
      projects: allUserProjects,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

export const addUserToProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { users, projectId } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const currentUserId = loggedInUser._id; // Changed variable name to match service

    try {
      const updatedProject = await projectService.addUsersToProject({
        users,
        projectId,
        currentUserId, // Changed to match the service parameter name
      });

      res.status(200).json({
        message: "Users added successfully",
        project: updatedProject,
      });
    } catch (error) {
      // Handle specific errors with appropriate status codes
      if (error.message.includes("Invalid Project ID format")) {
        return res.status(400).json({ message: error.message });
      } else if (error.message.includes("Invalid user ID format")) {
        return res.status(400).json({ message: error.message });
      } else if (error.message === "Project not found") {
        return res.status(404).json({ message: error.message });
      } else if (error.message.includes("not authorized")) {
        return res.status(403).json({ message: error.message });
      }
      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ message: "Project ID is required" });
  }

  try {
    // Check if projectId is valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    const project = await projectService.getProjectById({ projectId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json({ project });
  } catch (error) {
    console.error(`Error in getProjectById: ${error.message}`);

    // Send more helpful error messages
    if (error.message === "Project not found") {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(500).json({
      message: "An error occurred while fetching the project",
      error: error.message,
    });
  }
};

export const removeUserFromProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { users, projectId } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const currentUserId = loggedInUser._id; // Changed variable name to match service

    try {
      const updatedProject = await projectService.removeUsersFromProject({
        users,
        projectId,
        currentUserId, // Changed to match the service parameter name
      });

      res.status(200).json({
        message: "Users removed successfully",
        project: updatedProject,
      });
    } catch (error) {
      // Handle specific errors with appropriate status codes
      if (error.message.includes("Invalid Project ID format")) {
        return res.status(400).json({ message: error.message });
      } else if (error.message.includes("Invalid user ID format")) {
        return res.status(400).json({ message: error.message });
      } else if (error.message === "Project not found") {
        return res.status(404).json({ message: error.message });
      } else if (error.message.includes("not authorized")) {
        return res.status(403).json({ message: error.message });
      }
      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

export const updateFileTree = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { projectId, fileTree } = req.body;
    const project = await projectService.updateFileTree({
      projectId,
      fileTree,
    });
    return res
      .status(200)
      .json({ message: "File tree updated successfully", project });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};
