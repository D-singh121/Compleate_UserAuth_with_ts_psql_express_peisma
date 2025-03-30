import { PrismaClient } from "@prisma/client";
import { User } from "../types/User";

const prisma = new PrismaClient();

// Register a new user
const registerUserService = async (
  name: string,
  email: string,
  password: string
): Promise<User> => {
  return await prisma.user.create({
    data: { name, email, password },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    }, // Exclude password
  });
};

// Get all users
const getAllUsersService = async (): Promise<User[]> => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// Get a user by email
const getUserByEmailService = async (email: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// Get a user by ID (Fixed Typo)
const getUserByIDService = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    }, // Exclude password
  });
};

// Update user details
const updateUserService = async (
  id: string,
  data: Partial<User>
): Promise<User> => {
  // Check if email is being updated
  if (data.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // If the email exists and belongs to a different user, return an error
    if (existingUser && existingUser.id !== id) {
      throw Object.assign(
        new Error("Email is already in use by another user."),
        {
          statusCode: 400,
        }
      );
    }
  }

  return await prisma.user.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// Delete a user
const deleteUserService = async (id: string): Promise<User | null> => {
  // Check if the user exists before deleting
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    return null; // User not found
  }

  return await prisma.user.delete({
    where: { id },
  });
};

// Export all services
export {
  registerUserService,
  getAllUsersService,
  getUserByEmailService,
  getUserByIDService,
  updateUserService,
  deleteUserService,
};
