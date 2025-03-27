import { Response } from "express";

const handleResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): void => {
  res.status(statusCode).json({ message, data: data ?? null });
};

export default handleResponse;
