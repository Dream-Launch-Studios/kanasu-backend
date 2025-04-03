import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

// ✅ Define Expected Request Body Type
interface CreateCohortRequest {
  name: string;
  region: string;
  teacherIds?: string[]; // Optional array of teacher UUIDs
  studentIds?: string[]; // Optional array of student UUIDs
}

// ✅ Create a Cohort with Only Existing Teachers & Students
export const createCohort = async (
  req: Request<{}, {}, CreateCohortRequest>, // 👈 Strongly typed request body
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, region, teacherIds, studentIds } = req.body;

    if (!name || !region) {
      return res.status(400).json({ error: "Name and Region are required" });
    }

    // ✅ Validate Teachers: Ensure all provided teacher UUIDs exist in the database
    let validTeachers: { id: string }[] = [];
    if (teacherIds && teacherIds.length > 0) {
      const existingTeachers = await prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true },
      });

      validTeachers = existingTeachers.map((t) => ({ id: t.id }));
      const invalidTeacherIds = teacherIds.filter(
        (id) => !validTeachers.some((t) => t.id === id)
      );

      if (invalidTeacherIds.length > 0) {
        return res.status(400).json({
          error: "Some teachers do not exist",
          invalidTeacherIds,
        });
      }
    }

    // ✅ Validate Students: Ensure all provided student UUIDs exist in the database
    let validStudents: { id: string }[] = [];
    if (studentIds && studentIds.length > 0) {
      const existingStudents = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true },
      });

      validStudents = existingStudents.map((s) => ({ id: s.id }));
      const invalidStudentIds = studentIds.filter(
        (id) => !validStudents.some((s) => s.id === id)
      );

      if (invalidStudentIds.length > 0) {
        return res.status(400).json({
          error: "Some students do not exist",
          invalidStudentIds,
        });
      }
    }

    // ✅ Create Cohort & Associate Only Existing Teachers & Students
    const cohort = await prisma.cohort.create({
      data: {
        name,
        region,
        teachers: {
          connect: validTeachers, // ✅ Connect only existing teachers using UUID
        },
        students: {
          connect: validStudents, // ✅ Connect only existing students using UUID
        },
      },
      include: { teachers: true, students: true },
    });

    return res.status(201).json({ message: "Cohort created successfully", cohort });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Cohorts with Teachers & Students
export const getCohorts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cohorts = await prisma.cohort.findMany({
      include: { teachers: true, students: true },
    });
    return res.json(cohorts);
  } catch (error) {
    next(error);
  }
};

// ✅ Delete a Cohort
export const deleteCohort = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.cohort.delete({ where: { id } });
    return res.json({ message: "Cohort deleted successfully" });
  } catch (error) {
    next(error);
  }
};
