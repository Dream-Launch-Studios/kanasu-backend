import type { Request, Response } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    //@ts-ignore
    return res.json({ name: req.user.name });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};
