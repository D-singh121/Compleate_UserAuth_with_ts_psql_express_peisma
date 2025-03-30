import { Router } from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
} from "../controllers/user.controller";

const router = Router();

router.post("/user/register", registerUser);
router.post("/user/login", loginUser);
router.get("/user/logout", logOutUser);

router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset-password/:token", resetPassword);

router.get("/users", getAllUsers);
router.get("/user/:id", getUserById);
router.put("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);

export default router;
