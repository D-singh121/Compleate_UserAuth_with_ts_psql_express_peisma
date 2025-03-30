import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../types/User";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET as string;

if (!SECRET_KEY) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

interface AuthRequest extends Request {
  user?: User;
}

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token; // Get token from cookies
    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized: No token provided" });
      return;
    }

    const decoded = jwt.verify(token, SECRET_KEY) as User;
    req.user = decoded; // Attach user info to request object
    next(); // Proceed to next middleware
  } catch (error) {
    res
      .status(403)
      .json({ success: false, message: "Forbidden: Invalid token" });
  }
};

export default authMiddleware;
