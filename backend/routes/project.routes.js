import { Router } from "express";
import { body } from "express-validator";
import * as projectController from "../controllers/project.controller.js";
import * as authMiddleWare from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  authMiddleWare.authUser,
  body("name").isString().withMessage("Name is required"),
  projectController.createProject
);

router.get("/all", authMiddleWare.authUser, projectController.getAllProject);

router.put(
  "/add-user",
  authMiddleWare.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  body("users")
    .isArray()
    .withMessage("Users must be an array")
    .bail()
    .custom((users) => users.every((user) => typeof user === "string"))
    .withMessage("Users must be an array of strings"),
  projectController.addUserToProject
);

router.get(
  "/get-projects/:projectId",
  authMiddleWare.authUser,
  projectController.getProjectById
);
// Add this route to your existing project routes
router.put(
  "/remove-user",
  authMiddleWare.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  body("users")
    .isArray()
    .withMessage("Users must be an array")
    .bail()
    .custom((users) => users.every((user) => typeof user === "string"))
    .withMessage("Users must be an array of strings"),
  projectController.removeUserFromProject
);

router.put(
  "/update-file-tree",
  authMiddleWare.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  body("fileTree").isObject().withMessage("File tree is required"),
  body("fileTree").notEmpty().withMessage("File tree cannot be empty"),
  projectController.updateFileTree
);
export default router;
