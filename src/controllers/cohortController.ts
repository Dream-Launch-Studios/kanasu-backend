import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

// ✅ Define Expected Request Body Type
interface CreateCohortRequest {
  name: string;
  region: string;
  teacherIds?: string[];
}

// ✅ Create a Cohort with Only Existing Teachers
export const createCohort = async (
  req: Request<{}, {}, CreateCohortRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, region, teacherIds } = req.body;

    if (!name || !region) {
      return res.status(400).json({ error: "Name and Region are required" });
    }

    // ✅ Validate Teachers
    let validTeachers: { id: string }[] = [];
    if (teacherIds?.length) {
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

    // ✅ Create Cohort (Only with valid teachers)
    const cohort = await prisma.cohort.create({
      data: {
        name,
        region,
        teachers: {
          connect: validTeachers,
        },
      },
      include: { teachers: true }, // ✅ Only include teachers
    });

    return res
      .status(201)
      .json({ message: "Cohort created successfully", cohort });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Cohorts with Teachers
export const getCohorts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cohorts = await prisma.cohort.findMany({
      include: { teachers: true }, // ✅ Only include teachers
    });
    return res.json(cohorts);
  } catch (error) {
    next(error);
  }
};

// ✅ Delete a Cohort
export const deleteCohort = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await prisma.cohort.delete({ where: { id } });
    return res.json({ message: "Cohort deleted successfully" });
  } catch (error) {
    next(error);
  }
};
