import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

// ✅ Create a Student
export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, age, gender, status, anganwadiId } = req.body;

    if (!name || !age || !gender || !status) {
      return res.status(400).json({ error: "Name and Age are required" });
    }

    const student = await prisma.student.create({
      data: {
        name,
        age,
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

// ✅ Get All Students
export const getStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const students = await prisma.student.findMany({
      include: { anganwadi: true },
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

    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id: anganwadiId },
    });
    if (!anganwadi)
      return res.status(404).json({ error: "Anganwadi not found" });

    const studentExists = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!studentExists)
      return res.status(404).json({ error: "Student not found" });

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

export const searchAndAddStudentToAnganwadiByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, age, anganwadiName } = req.body;

    if (!name && !age) {
      return res
        .status(400)
        .json({ error: "At least name or age is required to search" });
    }

    if (!anganwadiName) {
      return res.status(400).json({ error: "Anganwadi name is required" });
    }

    const anganwadi = await prisma.anganwadi.findFirst({
      where: { name: { equals: anganwadiName, mode: "insensitive" } },
    });

    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    const student = await prisma.student.findFirst({
      where: {
        AND: [
          name ? { name: { contains: name, mode: "insensitive" } } : {},
          age ? { age: Number(age) } : {},
        ],
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: { anganwadiId: anganwadi.id },
      include: { anganwadi: true },
    });

    return res.status(200).json({
      message: "Student assigned to anganwadi successfully",
      student: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

export const searchStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = req.query.search as string;

    const isAgeSearch = !isNaN(Number(search));

    const students = await prisma.student.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { gender: { contains: search, mode: "insensitive" } },
              ...(isAgeSearch ? [{ age: Number(search) }] : []),
            ],
          }
        : {},
      include: { anganwadi: true },
    });

    return res.json(students);
  } catch (error) {
    next(error);
  }
};
