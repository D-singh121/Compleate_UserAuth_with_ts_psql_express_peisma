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
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      throw Object.assign(new Error("All fields are required"), {
        statusCode: 400,
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw Object.assign(new Error("Invalid email format"), {
        statusCode: 400,
      });
    }
    if (password.length < 6) {
      throw Object.assign(
        new Error("Password must be at least 6 characters long"),
        { statusCode: 400 }
      );
    }

    const existingUser = await getUserByEmailService(email);
    if (existingUser) {
      throw Object.assign(new Error("Email already registered"), {
        statusCode: 409,
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await registerUserService(name, email, hashedPassword);
    const { password: _, ...userData } = newUser;

    handleResponse(res, 201, "User registered successfully", userData);
  }
);

// User Login
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password?.trim()) {
    throw Object.assign(new Error("Email and Password are required."), {
      statusCode: 400,
    });
  }

  const user = await getUserByEmailService(email);
  console.log("User found:", user);
  if (!user || !bcrypt.compareSync(password, user.password || "")) {
    throw Object.assign(new Error("Invalid email or password."), {
      statusCode: 401,
    });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "2d",
  });
  res.cookie("token", token, { httpOnly: true });

  handleResponse(res, 200, `Welcome back ${user.name}`);
});

// User Logout
const logOutUser = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("token", { httpOnly: true, path: "/" });
  handleResponse(res, 200, "Logout successful");
});

// Get All Users
const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await getAllUsersService();
  handleResponse(res, 200, "All users retrieved successfully", users);
});

// Get User by ID
const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await getUserByIDService(id);
  if (!user) {
    throw Object.assign(new Error("User not found."), { statusCode: 404 });
  }
  handleResponse(res, 200, "User found", user);
});

// Update User
const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email } = req.body;
  if (!name?.trim() || !email?.trim()) {
    throw Object.assign(new Error("Name and Email are required."), {
      statusCode: 400,
    });
  }

  const updatedUser = await updateUserService(id, { name, email });
  if (!updatedUser) {
    throw Object.assign(new Error("User not found."), { statusCode: 404 });
  }

  handleResponse(res, 200, "User updated successfully", updatedUser);
});

// Delete User
const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedUser = await deleteUserService(id);
  if (!deletedUser) {
    throw Object.assign(new Error("User not found."), { statusCode: 404 });
  }
  handleResponse(res, 200, "User deleted successfully");
});

export {
  registerUser,
  loginUser,
  logOutUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
