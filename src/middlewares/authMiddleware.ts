import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export const authMiddleware = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 🔥 Ensure token contains id, name, and role
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; name: string; role: string };

    if (!roles.includes(decoded.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = {
      id: decoded.id, // Ensure it's stored as `userId`
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};


export const authorizeAdmin = (req : Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}