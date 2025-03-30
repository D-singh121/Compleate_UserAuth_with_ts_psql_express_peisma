import { Request, Response, NextFunction } from "express";

// Define a generic asyncHandler type
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Improved asyncHandler function
const asyncHandler =
  (fn: AsyncHandler) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error("Unhandled Error:", err);

      next(err); // Pass the original error to the error handler
    }
  };

export default asyncHandler;
