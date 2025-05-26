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
      role: string;
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
      return res.status(409).json({ error: "User already exists" });
    }

    // Convert role to uppercase to match Prisma enum
    const userRole = role.toUpperCase();

    // Validate the role
    if (!["ADMIN", "REGIONAL_COORDINATOR", "TEACHER"].includes(userRole)) {
      return res.status(400).json({
        error:
          "Invalid role. Role must be one of: ADMIN, REGIONAL_COORDINATOR, TEACHER",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole as "ADMIN" | "REGIONAL_COORDINATOR" | "TEACHER",
        name,
      },
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
    console.error("Registration error:", error);
    return res.status(500).json({
      error: "Failed to register user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
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
      name: user.name,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Failed to login",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
