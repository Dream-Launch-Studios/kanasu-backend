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
      return res.status(400).json({
        error: "Name, Phone, and Anganwadi ID are required",
      });
    }

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
  _req: Request,
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

// ✅ Get Teacher by ID (with Evaluation Count)
export const getTeacherById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        cohort: true,
        anganwadi: true,
        evaluations: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return res.json({
      ...teacher,
      evaluationCount: teacher.evaluations.length,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Update Teacher Info
export const updateTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, phone, cohortId, anganwadiId } = req.body;

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: {
        name,
        phone,
        cohortId,
        anganwadiId,
      },
    });

    return res.json({
      message: "Teacher updated successfully",
      teacher: updatedTeacher,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Search Teachers by name/phone
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

// ✅ Delete Teacher
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

// ✅ Get Teacher Rankings (Based on #Evaluations — for MVP)
export const getTeacherRankings = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        evaluations: true,
        anganwadi: true,
        cohort: true,
      },
    });

    const ranked = teachers
      .map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        phone: teacher.phone,
        cohort: teacher.cohort?.name || "Unassigned",
        anganwadi: teacher.anganwadi?.name || "Unassigned",
        evaluationsCount: teacher.evaluations.length,
      }))
      .sort((a, b) => b.evaluationsCount - a.evaluationsCount);

    return res.json(ranked);
  } catch (error) {
    next(error);
  }
};

// ✅ Get Students Evaluated by a Teacher
export const getTeacherStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const evaluations = await prisma.evaluation.findMany({
      where: { teacherId: id },
      include: { student: true },
    });

    const uniqueStudents = new Map();

    evaluations.forEach((e) => {
      if (!uniqueStudents.has(e.student.id)) {
        uniqueStudents.set(e.student.id, e.student);
      }
    });

    res.json(Array.from(uniqueStudents.values()));
  } catch (error) {
    next(error);
  }
};
