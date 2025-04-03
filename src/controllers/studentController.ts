import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

// ✅ Create a Student
export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, age, cohortId } = req.body;
    if (!name || !age || !cohortId)
      return res
        .status(400)
        .json({ error: "Name, Age, and Cohort ID are required" });

    const student = await prisma.student.create({
      data: { name, age, cohortId },
    });

    return res
      .status(201)
      .json({ message: "Student created successfully", student });
  } catch (error) {
    next(error);
  }
};

export const addStudentToCohort = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, age, cohortId } = req.body;
    if (!name || !age || !cohortId)
      return res
        .status(400)
        .json({ error: "Name, Age, and Cohort ID are required" });

    // Check if the cohort exists
    const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) return res.status(404).json({ error: "Cohort not found" });

    const student = await prisma.student.create({
      data: { name, age, cohortId },
    });

    return res
      .status(201)
      .json({ message: "Student added to cohort successfully", student });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Students
export const getStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const students = await prisma.student.findMany({
      include: { cohort: true },
    });
    return res.json(students);
  } catch (error) {
    next(error);
  }
};

// ✅ Delete a Student
export const deleteStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id } });
    return res.json({ message: "Student deleted successfully" });
  } catch (error) {
    next(error);
  }
};
