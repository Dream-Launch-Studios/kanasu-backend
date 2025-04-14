import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

// We'll use the type declaration from src/types/express.d.ts instead

export const authMiddleware =
  (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      // Verify the token
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
        id: string;
        name?: string;
        role: string;
        anganwadiId?: string | null; // Add anganwadiId for teacher tokens
      };

      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Assign user properties, ensuring name is always a string
      req.user = {
        id: decoded.id,
        name: decoded.name || "", // Convert undefined to empty string
        role: decoded.role,
        anganwadiId: decoded.anganwadiId || null, // Add anganwadiId to user object
      };

      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};
