import { Router } from "express";
const router = Router();
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleWare from "../middleware/auth.middleware.js";

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Email must be a valid email address"),
    body("password")
      .isLength({ min: 3 })
      .withMessage("Password must be at least 3 characters long"),
    body("gender")
      .notEmpty()
      .withMessage("Gender is required")
      .isIn(["male", "female", "MALE", "FEMALE"])
      .withMessage("Gender must be either male or female"),
  ],
  userController.createUserController
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Email must be a valid email address"),
  body("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters long"),
  userController.loginUserController
);
router.get(
  "/profile",
  authMiddleWare.authUser,
  userController.profileUserController
);
router.put(
  "/profile/gender",
  authMiddleWare.authUser,
  body("gender")
    .isIn(["male", "female", "MALE", "FEMALE"])
    .withMessage("Gender must be either male or female"),
  userController.updateGenderController
);

router.get("/logout", authMiddleWare.authUser, userController.logoutController);
router.get(
  "/all",
  authMiddleWare.authUser,
  userController.getAllUsersController
);
export default router;
