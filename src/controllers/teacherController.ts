import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

// ✅ Create a Teacher (Cohort ID & Anganwadi ID are Optional)
export const createTeacher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, cohortId, anganwadiId } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and Phone are required" });
    }

    const teacher = await prisma.teacher.create({
      data: {
        name,
        phone,
        cohortId: cohortId || null, // Allow cohortId to be null
        anganwadiId: anganwadiId || null, // Allow anganwadiId to be null
      },
    });

    return res
      .status(201)
      .json({ message: "Teacher created successfully", teacher });
  } catch (error) {
    next(error);
  }
};

// ✅ Assign a Teacher to a Cohort
export const addTeacherToCohort = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teacherId, cohortId } = req.body;

    if (!teacherId || !cohortId) {
      return res
        .status(400)
        .json({ error: "Teacher ID and Cohort ID are required" });
    }

    // Check if the cohort exists
    const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Check if the teacher exists
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Update the teacher's cohortId
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: { cohortId },
    });

    return res.status(200).json({
      message: "Teacher added to cohort successfully",
      teacher: updatedTeacher,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Assign a Teacher to an Anganwadi
export const assignTeacherToAnganwadi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teacherId, anganwadiId } = req.body;

    if (!teacherId || !anganwadiId) {
      return res
        .status(400)
        .json({ error: "Teacher ID and Anganwadi ID are required" });
    }

    // Check if the Anganwadi exists
    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id: anganwadiId },
    });
    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    // Check if the teacher exists
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Update the teacher's anganwadiId
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: { anganwadiId },
    });

    return res.status(200).json({
      message: "Teacher assigned to Anganwadi successfully",
      teacher: updatedTeacher,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Teachers (Include Cohort & Anganwadi Info)
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

export const getTeachersByAnganwadi = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id, name } = req.query;
  
      if (!id && !name) {
        return res
          .status(400)
          .json({ error: "Anganwadi ID or Name is required" });
      }
  
      let anganwadi;
      if (id) {
        anganwadi = await prisma.anganwadi.findUnique({
          where: { id: id as string },
          include: { teachers: true },
        });
      } else if (name) {
        anganwadi = await prisma.anganwadi.findFirst({
          where: { name: name as string },
          include: { teachers: true },
        });
      }
  
      if (!anganwadi) {
        return res.status(404).json({ error: "Anganwadi not found" });
      }
  
      return res.json({
        anganwadiId: anganwadi.id,
        anganwadiName: anganwadi.name,
        teachers: anganwadi.teachers,
      });
    } catch (error) {
      next(error);
    }
  };
  