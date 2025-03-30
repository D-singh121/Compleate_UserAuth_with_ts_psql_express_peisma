import { Request, Response, NextFunction } from "express";

// Define an extended error type
interface CustomError extends Error {
  statusCode?: number;
}

// Centralized Error Handler
const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err.stack || err.message);

  // Use the provided status code or default to 500
  const statusCode =
    err.statusCode && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack, // Hide stack in production
  });
};

export default errorHandler;
