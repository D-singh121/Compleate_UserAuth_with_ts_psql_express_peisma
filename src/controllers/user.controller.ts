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

import nodemailer from "nodemailer";
import prisma from "../services/userService";

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
  const token = req.cookies?.token; // Get token from cookies

  if (!token) {
    return handleResponse(res, 400, "No user is currently logged in");
  }

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

// Forgot Password
const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email?.trim()) {
    throw Object.assign(new Error("Email is required."), { statusCode: 400 });
  }

  // Validate Email Format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error("Invalid email format"), {
      statusCode: 400,
    });
  }

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(
      new Error("Email is not register please go for sign-up ! ."),
      { statusCode: 404 }
    );
  }

  // Generate Reset Token (Valid for 15 mins)
  const resetToken = jwt.sign({ email }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  // Save Token in Database
  await prisma.user.update({
    where: { email },
    data: { resetToken },
  });

  // Send Email (Nodemailer)
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl: string = `http://localhost:8000/api/v1/user/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Reset Password",
    text: `Click this link to reset your password: ${resetUrl}`,
  });

  return handleResponse(res, 200, "Password reset link sent to email!");
});

// Reset Password
const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params || req.query; // Get token from request body
  const { newPassword } = req.body;

  if (!token || !newPassword?.trim()) {
    throw Object.assign(new Error("Token and new password are required."), {
      statusCode: 400,
    });
  }

  // Verify Token
  let decoded: { email: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
  } catch (error) {
    throw Object.assign(new Error("Invalid or expired token."), {
      statusCode: 400,
    });
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user || user.resetToken !== token) {
    throw Object.assign(new Error("Invalid or expired token."), {
      statusCode: 400,
    });
  }

  // Hash new password
  const hashedPassword: string = bcrypt.hashSync(newPassword, 10);

  // Update user password & remove token
  await prisma.user.update({
    where: { email: user.email },
    data: { password: hashedPassword, resetToken: null },
  });

  return handleResponse(res, 200, "Password reset successfully!");
});

export {
  registerUser,
  loginUser,
  logOutUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
};
