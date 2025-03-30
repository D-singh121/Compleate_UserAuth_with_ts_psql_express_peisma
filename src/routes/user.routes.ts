import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
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

router.get("/users", authMiddleware, getAllUsers);
router.get("/user/:id", authMiddleware, getUserById);
router.put("/user/:id", authMiddleware, updateUser);
router.delete("/user/:id", authMiddleware, deleteUser);

export default router;
