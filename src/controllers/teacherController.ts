import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

// ✅ Create a Teacher (Only one teacher per Anganwadi allowed)
export const createTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, cohortId, anganwadiId } = req.body;

    if (!name || !phone || !anganwadiId) {
      return res
        .status(400)
        .json({ error: "Name, Phone, and Anganwadi ID are required" });
    }

    // Check if a teacher is already assigned to this Anganwadi
    const existingTeacher = await prisma.teacher.findFirst({
      where: { anganwadiId },
    });

    if (existingTeacher) {
      return res
        .status(400)
        .json({ error: "A teacher already exists for this Anganwadi" });
    }

    const teacher = await prisma.teacher.create({
      data: {
        name,
        phone,
        cohortId: cohortId || null,
        anganwadiId,
      },
    });

    return res
      .status(201)
      .json({ message: "Teacher created successfully", teacher });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Teachers
export const getTeachers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: { cohort: true, anganwadi: true },
    });
    return res.json(teachers);
  } catch (error) {
    next(error);
  }
};

// ✅ Search Teachers
export const searchTeachers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query;

    const teachers = await prisma.teacher.findMany({
      where: {
        OR: search
          ? [
              { name: { contains: search as string, mode: "insensitive" } },
              { phone: { contains: search as string, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: { cohort: true, anganwadi: true },
    });

    return res.json(teachers);
  } catch (error) {
    next(error);
  }
};

// ✅ Delete a Teacher
export const deleteTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.teacher.delete({ where: { id } });

    return res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ✅ Get a single Teacher by ID
export const getTeacherById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { cohort: true, anganwadi: true },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return res.json(teacher);
  } catch (error) {
    next(error);
  }
};
