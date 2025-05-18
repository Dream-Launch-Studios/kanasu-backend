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
    const {
      name,
      location,
      district,
      studentIds,
      students: newStudents,
    } = req.body;

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
      createNewStudents = newStudents.map(
        (s) =>
          ({
            name: s.name,
            gender: s.gender,
          } as { name: string; gender: string })
      );
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

    // Check if anganwadi exists
    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id },
    });

    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    // Delete the anganwadi
    await prisma.anganwadi.delete({
      where: { id },
    });

    return res.json({ message: "Anganwadi deleted successfully" });
  } catch (error: any) {
    // Handle potential foreign key constraint errors
    if (error.code === "P2003") {
      return res.status(400).json({
        error:
          "Cannot delete this Anganwadi because it has related records. Please remove all dependencies first.",
      });
    }
    next(error);
  }
};

// ✅ Check if an Anganwadi has any dependencies (assessments, etc.)
export const checkAnganwadiDependencies = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if anganwadi exists
    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id },
      include: {
        students: true,
        anganwadiAssessments: true,
        studentSubmissions: true,
      },
    });

    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    const dependencies = {
      hasDependencies: false,
      details: "",
      counts: {
        students: anganwadi.students?.length || 0,
        anganwadiAssessments: anganwadi.anganwadiAssessments?.length || 0,
        studentSubmissions: anganwadi.studentSubmissions?.length || 0,
      },
    };

    // Check if anganwadi has students
    if (anganwadi.students && anganwadi.students.length > 0) {
      dependencies.hasDependencies = true;
      dependencies.details = `Anganwadi has ${anganwadi.students.length} student(s) associated with it.`;
    }

    // Check if anganwadi has assessment records
    if (
      anganwadi.anganwadiAssessments &&
      anganwadi.anganwadiAssessments.length > 0
    ) {
      dependencies.hasDependencies = true;
      if (dependencies.details) {
        dependencies.details += ` It also has ${anganwadi.anganwadiAssessments.length} assessment record(s).`;
      } else {
        dependencies.details = `Anganwadi has ${anganwadi.anganwadiAssessments.length} assessment record(s).`;
      }
    }

    // Check if anganwadi has student submissions
    if (
      anganwadi.studentSubmissions &&
      anganwadi.studentSubmissions.length > 0
    ) {
      dependencies.hasDependencies = true;
      if (dependencies.details) {
        dependencies.details += ` It also has ${anganwadi.studentSubmissions.length} student submission(s).`;
      } else {
        dependencies.details = `Anganwadi has ${anganwadi.studentSubmissions.length} student submission(s).`;
      }
    }

    return res.json(dependencies);
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

// Remove all students from an Anganwadi
export const removeAllStudentsFromAnganwadi = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id },
      include: { students: true }
    });

    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    // Get all student IDs
    const studentIds = anganwadi.students.map(student => ({ id: student.id }));

    if (studentIds.length === 0) {
      return res.status(200).json({ 
        message: "No students to remove",
        count: 0
      });
    }

    // Disconnect all students from the anganwadi
    await prisma.anganwadi.update({
      where: { id },
      data: {
        students: {
          disconnect: studentIds
        }
      }
    });

    return res.status(200).json({ 
      message: "All students removed from Anganwadi successfully",
      count: studentIds.length
    });
  } catch (error) {
    next(error);
  }
};

// Remove specific dependencies from Anganwadi to prepare for deletion
export const removeAnganwadiDependencies = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id },
      include: {
        students: true,
        anganwadiAssessments: true,
        studentSubmissions: true
      }
    });

    if (!anganwadi) {
      return res.status(404).json({ error: "Anganwadi not found" });
    }

    // Count of removed dependencies
    const removed = {
      students: 0,
      assessments: 0,
      submissions: 0
    };

    // 1. Remove student connections
    if (anganwadi.students.length > 0) {
      const studentIds = anganwadi.students.map(student => ({ id: student.id }));
      await prisma.anganwadi.update({
        where: { id },
        data: {
          students: {
            disconnect: studentIds
          }
        }
      });
      removed.students = studentIds.length;
    }

    // 2. Delete anganwadi assessments if any
    if (anganwadi.anganwadiAssessments.length > 0) {
      await prisma.anganwadiAssessment.deleteMany({
        where: { anganwadiId: id }
      });
      removed.assessments = anganwadi.anganwadiAssessments.length;
    }

    // 3. Delete student submissions if any
    if (anganwadi.studentSubmissions.length > 0) {
      await prisma.studentSubmission.deleteMany({
        where: { anganwadiId: id }
      });
      removed.submissions = anganwadi.studentSubmissions.length;
    }

    return res.status(200).json({
      message: "All dependencies removed successfully",
      removed
    });
  } catch (error) {
    next(error);
  }
};
