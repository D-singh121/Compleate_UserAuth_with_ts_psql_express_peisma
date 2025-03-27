// Purpose: Middleware to handle async functions in express routes.

import { Request, Response, NextFunction } from "express";

// define a generic asyncHander type;
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

const asyncHandler =
  (fn: AsyncHandler) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      console.error("Error:", err); // Log error for debugging

      // Ensure a valid HTTP status code
      const statusCode =
        err.statusCode && err.statusCode >= 400 && err.statusCode < 600
          ? err.statusCode
          : 500;

      next({
        statusCode,
        message: err.message || "Internal Server Error",
      });
    }
  };

export default asyncHandler;
