import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

// ✅ Create a Student
export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, age, cohortId, gender, status, anganwadiId } = req.body;
    if (!name || !age || !cohortId)
      return res
        .status(400)
        .json({ error: "Name, Age, and Cohort ID are required" });

    const student = await prisma.student.create({
      data: {
        name,
        age,
        cohortId: cohortId || null,
        gender,
        anganwadiId: anganwadiId || null, 
        status: status || "ACTIVE",
      },
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

export const addStudentToAnganwadi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, anganwadiId } = req.body;
    if (!studentId || !anganwadiId)
      return res
        .status(400)
        .json({ error: "Student ID and Anganwadi ID are required" });

    // Check if the anganwadi exists
    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id: anganwadiId },
    });
    if (!anganwadi)
      return res.status(404).json({ error: "Anganwadi not found" });

    // Check if the student exists
    const studentExists = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!studentExists)
      return res.status(404).json({ error: "Student not found" });

    // Update the student with the anganwadi ID
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { anganwadiId },
      include: { anganwadi: true },
    });

    return res.status(200).json({
      message: "Student added to anganwadi successfully",
      student: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentsByAnganwadi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { anganwadiId } = req.params;

    if (!anganwadiId) {
      return res.status(400).json({ error: "Anganwadi ID is required" });
    }

    const students = await prisma.student.findMany({
      where: { anganwadiId },
      include: { anganwadi: true },
    });

    return res.json({ message: "Students fetched successfully", students });
  } catch (error) {
    next(error);
  }
};
