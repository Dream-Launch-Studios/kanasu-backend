import express from "express";
import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";
import jwt from "jsonwebtoken";
// User Registration
export const register = async (
  req: Request<
    {},
    {},
    {
      email: string;
      password: string;
      name: string;
      role: "ADMIN" | "REGIONAL_COORDINATOR";
    }
  >,
  res: Response,
  next: NextFunction
) => {
  const { email, password, role, name } = req.body;

  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role, name },
    });

    // 🔥 Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET as string, // Ensure JWT_SECRET is set in .env
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
};
// User Login
export const login = async (
  req: Request<{}, {}, { email: string; password: string }>,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      userId: user.id,
    });
  } catch (error) {
    return next(error);
  }
};
