import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "../middlewares/asyncHandler";
import handleResponse from "../middlewares/responseHandler";
import {
  registerUserService,
  getUserByEmailService,
  getAllUsersService,
  getUserByIDService,
  updateUserService,
  deleteUserService,
} from "../services/userService";

// User Registration
const registerUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      name === "" ||
      email === "" ||
      password === ""
    ) {
      return next(new Error("Name, Email, and Password are required."));
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new Error("Invalid email format."));
    }

    if (password.length < 6) {
      return next(new Error("Password must be at least 6 characters long."));
    }

    const existingUser = await getUserByEmailService(email);
    if (existingUser) {
      return next(new Error("Email is already registered. Please log in."));
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await registerUserService(name, email, hashedPassword);

    const { password: _, ...userData } = newUser; // Exclude password
    handleResponse(res, 201, "User registered successfully", userData);
  }
);

// User Login
const loginUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (
      !email ||
      !password ||
      email === "" ||
      password === "" ||
      !email.trim() ||
      !password.trim()
    ) {
      return next(new Error("Email and Password are required."));
    }

    const user = await getUserByEmailService(email);
    if (!user) {
      return next(new Error("Invalid email or password."));
    }

    const isMatch = bcrypt.compareSync(password, user.password || "");
    if (!isMatch) {
      return next(new Error("Invalid email or password."));
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "2d",
    });

    res.cookie("token", token, { httpOnly: true });
    handleResponse(res, 200, `Welcome back ${user.name}`);
  }
);

// User Logout
const logOutUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;

    if (!token) {
      return next(new Error("Already logged out."));
    }

    res.clearCookie("token", { httpOnly: true, path: "/" });
    handleResponse(res, 200, "Logout successful");
  }
);

// Get All Users
const getAllUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await getAllUsersService();
    handleResponse(res, 200, "All users retrieved successfully", users);
  }
);

// Get User by ID
const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = await getUserByIDService(id);

    if (!user) {
      return next(new Error("User not found."));
    }

    handleResponse(res, 200, "User found", user);
  }
);

// Update User
const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (
      !name ||
      !email ||
      name === "" ||
      email === "" ||
      !name.trim() ||
      !email.trim()
    ) {
      return next(new Error("Name and Email are required."));
    }

    const updatedUser = await updateUserService(id, { name, email });
    if (!updatedUser) {
      return next(new Error("User not found."));
    }

    handleResponse(res, 200, "User updated successfully", updatedUser);
  }
);

// Delete User
const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const deletedUser = await deleteUserService(id);

    if (!deletedUser) {
      return next(new Error("User not found."));
    }

    handleResponse(res, 200, "User deleted successfully");
  }
);

export {
  registerUser,
  loginUser,
  logOutUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
