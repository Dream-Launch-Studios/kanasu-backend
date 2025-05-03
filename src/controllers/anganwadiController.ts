import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// Updated request interface
interface CreateAnganwadiRequest {
  name: string;
  location: string;
  district: string;
  teacher: {
    name: string;
    phone: string;
  };
  studentIds?: string[];
  // Optional array of new students for update
  students?: { name: string; gender: string }[];
}

export const createAnganwadi = async (
  req: Request<{}, {}, CreateAnganwadiRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, location, district, teacher, studentIds } = req.body;

    if (!name || !location || !district || !teacher) {
      return res.status(400).json({
        error: "Name, location, district and teacher info are required",
      });
    }

    // Validate teacher fields
    if (!teacher.name || !teacher.phone) {
      return res
        .status(400)
        .json({ error: "Teacher name and email are required" });
    }

    // Check for duplicate teacher email
    const existingTeacher = await prisma.teacher.findUnique({
      where: { phone: teacher.phone },
    });

    if (existingTeacher) {
      return res
        .status(400)
        .json({ error: "A teacher with this email already exists" });
    }

    // Validate student IDs if any
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

    // ✅ Create Anganwadi with one teacher and optional students
    const anganwadi = await prisma.anganwadi.create({
      data: {
        name,
        location,
        district,
        teacher: {
          create: {
            name: teacher.name,
            phone: teacher.phone,
          },
        },
        students:
          validStudents.length > 0
            ? {
                connect: validStudents,
              }
            : undefined,
      },
      include: { teacher: true, students: true },
    });

    return res
      .status(201)
      .json({ message: "Anganwadi created successfully", anganwadi });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Anganwadis
export const getAnganwadis = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query;

    let whereClause: Prisma.AnganwadiWhereInput = {};

    if (search && typeof search === "string") {
      whereClause = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const anganwadis = await prisma.anganwadi.findMany({
      where: whereClause,
      include: { teacher: true, students: true },
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
      include: { teacher: true, students: true },
    });

    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    return res.json(anganwadi);
  } catch (error) {
    next(error);
  }
};
// ✅ Update Anganwadi (students only)
export const updateAnganwadi = async (
  req: Request<{ id: string }, {}, Partial<CreateAnganwadiRequest>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, location, district, studentIds, students: newStudents } = req.body;

    const existingAnganwadi = await prisma.anganwadi.findUnique({
      where: { id },
    });

    if (!existingAnganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    // Prepare existing student connections
    let validStudentConnections: { id: string }[] = [];
    if (studentIds && studentIds.length > 0) {
      const existingStudents = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true },
      });
      validStudentConnections = existingStudents.map((s) => ({ id: s.id }));
      const invalidStudentIds = studentIds.filter(
        (id) => !validStudentConnections.some((s) => s.id === id)
      );
      if (invalidStudentIds.length > 0) {
        return res.status(400).json({
          error: "Some students do not exist",
          invalidStudentIds,
        });
      }
    }
    // Prepare new student creations
    let createNewStudents: { name: string; gender: string }[] = [];
    if (newStudents && newStudents.length > 0) {
      createNewStudents = newStudents.map((s) => ({
        name: s.name,
        gender: s.gender,
      } as { name: string; gender: string }));
    }
    // Build student update operations
    const studentUpdateOperations: any = {};
    if (validStudentConnections.length > 0) {
      studentUpdateOperations.connect = validStudentConnections;
    }
    if (createNewStudents.length > 0) {
      studentUpdateOperations.create = createNewStudents;
    }

    // Update anganwadi with optional name/location/district and student operations
    const anganwadi = await prisma.anganwadi.update({
      where: { id },
      data: {
        name,
        location,
        district,
        // Only include student operations if any
        ...(Object.keys(studentUpdateOperations).length > 0
          ? { students: studentUpdateOperations }
          : {}),
      },
      include: { teacher: true, students: true },
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

// ✅ Assign only students (not teachers anymore)
export const assignToAnganwadi = async (
  req: Request<{}, {}, { anganwadiId: string; studentId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { anganwadiId, studentId } = req.body;

    if (!anganwadiId || !studentId) {
      return res.status(400).json({
        error: "Anganwadi ID and student ID are required",
      });
    }

    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id: anganwadiId },
    });

    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    await prisma.anganwadi.update({
      where: { id: anganwadiId },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
    });

    return res.status(200).json({ message: "Student assigned successfully" });
  } catch (error) {
    next(error);
  }
};
