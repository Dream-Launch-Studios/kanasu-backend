import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";


interface CreateAnganwadiRequest {
  name: string;
  location: string;
  district: string;
  teacherIds?: string[]; 
  studentIds?: string[];
}

export const createAnganwadi = async (
  req: Request<{}, {}, CreateAnganwadiRequest>, // 👈 Strongly typed request body
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, location, district, teacherIds, studentIds } = req.body;

    if (!name || !location || !district) {
      return res
        .status(400)
        .json({ error: "Name, Location, and District are required" });
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

    // ✅ Create Anganwadi & Associate Only Existing Teachers & Students
    const anganwadi = await prisma.anganwadi.create({
      data: {
        name,
        location,
        district,
        teachers: {
          connect: validTeachers, // ✅ Connect only existing teachers using UUID
        },
        students: {
          connect: validStudents, // ✅ Connect only existing students using UUID
        },
      },
      include: { teachers: true, students: true },
    });

    return res
      .status(201)
      .json({ message: "Anganwadi created successfully", anganwadi });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Anganwadis with Teachers & Students
export const getAnganwadis = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const anganwadis = await prisma.anganwadi.findMany({
      include: { teachers: true, students: true },
    });
    return res.json(anganwadis);
  } catch (error) {
    next(error);
  }
};

// ✅ Get Single Anganwadi by ID
export const getAnganwadiById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id },
      include: { teachers: true, students: true },
    });

    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    return res.json(anganwadi);
  } catch (error) {
    next(error);
  }
};

// ✅ Update an Anganwadi
export const updateAnganwadi = async (
  req: Request<{ id: string }, {}, Partial<CreateAnganwadiRequest>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, location, district, teacherIds, studentIds } = req.body;

    // Check if anganwadi exists
    const existingAnganwadi = await prisma.anganwadi.findUnique({
      where: { id },
    });

    if (!existingAnganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    // ✅ Validate Teachers if provided
    let teacherConnections = undefined;
    if (teacherIds && teacherIds.length > 0) {
      const existingTeachers = await prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true },
      });

      const validTeachers = existingTeachers.map((t) => ({ id: t.id }));
      const invalidTeacherIds = teacherIds.filter(
        (id) => !validTeachers.some((t) => t.id === id)
      );

      if (invalidTeacherIds.length > 0) {
        return res.status(400).json({
          error: "Some teachers do not exist",
          invalidTeacherIds,
        });
      }

      teacherConnections = {
        set: validTeachers, // Replace existing connections
      };
    }

    // ✅ Validate Students if provided
    let studentConnections = undefined;
    if (studentIds && studentIds.length > 0) {
      const existingStudents = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true },
      });

      const validStudents = existingStudents.map((s) => ({ id: s.id }));
      const invalidStudentIds = studentIds.filter(
        (id) => !validStudents.some((s) => s.id === id)
      );

      if (invalidStudentIds.length > 0) {
        return res.status(400).json({
          error: "Some students do not exist",
          invalidStudentIds,
        });
      }

      studentConnections = {
        set: validStudents, // Replace existing connections
      };
    }

    // ✅ Update Anganwadi
    const anganwadi = await prisma.anganwadi.update({
      where: { id },
      data: {
        name,
        location,
        district,
        teachers: teacherConnections,
        students: studentConnections,
      },
      include: { teachers: true, students: true },
    });

    return res.json({ message: "Anganwadi updated successfully", anganwadi });
  } catch (error) {
    next(error);
  }
};

// ✅ Delete an Anganwadi
export const deleteAnganwadi = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await prisma.anganwadi.delete({ where: { id } });
    return res.json({ message: "Anganwadi deleted successfully" });
  } catch (error) {
    next(error);
  }
};
