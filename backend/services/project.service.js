import projectModel from "../models/project.model.js";
import mongoose from "mongoose";
export const createProject = async ({ name, userId }) => {
  if (!name) {
    throw new Error("Name is required");
  }
  if (!userId) {
    throw new Error("User ID is required");
  }
  const project = await projectModel.create({
    name,
    users: [userId],
  });
  return project;
};

export const getAllProjectByUserId = async ({ userId }) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  const allUserProjects = await projectModel.find({ users: userId });
  return allUserProjects;
};

export const addUsersToProject = async ({
  users,
  projectId,
  currentUserId,
}) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid Project ID format");
  }

  if (!users || !Array.isArray(users) || users.length === 0) {
    throw new Error("Users array is required and cannot be empty");
  }

  const invalidUserIds = users.filter(
    (userId) => !mongoose.Types.ObjectId.isValid(userId)
  );
  if (invalidUserIds.length > 0) {
    throw new Error(`Invalid user ID format for: ${invalidUserIds.join(", ")}`);
  }

  if (!currentUserId) {
    throw new Error("Current user ID is required");
  }

  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const currentUserIdStr = currentUserId.toString();

  if (!project.users.some((id) => id.toString() === currentUserIdStr)) {
    throw new Error("User not authorized to add users to project");
  }

  // Convert existing user IDs to strings for easier comparison
  const existingUserIdsStr = project.users.map((id) => id.toString());

  // Filter out users that are already in the project
  const uniqueNewUsers = users.filter(
    (userId) => !existingUserIdsStr.includes(userId.toString())
  );

  // If no new unique users, throw an error
  if (uniqueNewUsers.length === 0) {
    return project; // Just return the project without modifying
  }
  project.users.push(...uniqueNewUsers);
  await project.save();
  return project;
};

export const getProjectById = async ({ projectId }) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid Project ID format");
  }
  const project = await projectModel
    .findOne({
      _id: projectId,
    })
    .populate("users");

  if (!project) {
    throw new Error("Project not found");
  }
  return project;
};
// Add this service function
export const removeUsersFromProject = async ({
  users,
  projectId,
  currentUserId,
}) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid Project ID format");
  }

  if (!users || !Array.isArray(users) || users.length === 0) {
    throw new Error("At least one user ID is required");
  }

  // Verify the current user has access to this project
  const project = await projectModel.findOne({
    _id: projectId,
    users: currentUserId,
  });

  if (!project) {
    throw new Error("Project not found or you don't have access to it");
  }

  // Remove users from the project
  const updatedProject = await projectModel.findByIdAndUpdate(
    projectId,
    { $pull: { users: { $in: users } } },
    { new: true } // Return the updated document
  );

  return updatedProject;
};

export const updateFileTree = async ({ projectId, fileTree }) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid Project ID format");
  }
  if (!fileTree) {
    throw new Error("File tree is required");
  }

  // Verify the current user has access to this project
  const project = await projectModel.findOneAndUpdate(
    {
      _id: projectId,
    },
    {
      fileTree: fileTree,
    },
    {
      new: true,
    }
  );
  if (!project) {
    throw new Error("Project not found");
  }
  project.fileTree = fileTree;
  await project.save();
  return project;
};
export default { createProject };
