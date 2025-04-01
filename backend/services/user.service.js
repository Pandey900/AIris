import userModel from "../models/user.model.js";

export const createUser = async ({ email, password, gender }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  if (!gender) {
    throw new Error("Gender is required");
  }

  if (!["male", "female"].includes(gender.toLowerCase())) {
    throw new Error("Invalid gender value. Must be 'male' or 'female'");
  }

  const hashedPassword = await userModel.hashPassword(password);
  const user = await userModel.create({
    email,
    password: hashedPassword,
    gender: gender.toLowerCase(),
  });

  return user;
};

export const getAllUsers = async ({ userId }) => {
  const users = await userModel.find({
    _id: { $ne: userId },
  });
  return users;
};

export const getUserById = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUser = async (userId, updateData) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (updateData.gender) {
    if (!["male", "female"].includes(updateData.gender.toLowerCase())) {
      throw new Error("Invalid gender value. Must be 'male' or 'female'");
    }
    updateData.gender = updateData.gender.toLowerCase();
  }

  const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

export const getUserByEmail = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
