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
        //@ts-ignore
        OR: search
          ? [
              { name: { contains: search as string, mode: "insensitive" } },
              { phone: { equals: parseInt(search as string) } },
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

// Get active assessment sessions for a teacher
export const getTeacherAssessmentSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const now = new Date();

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { anganwadi: true },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Get active assessment sessions
    const activeSessions = await prisma.assessmentSession.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        evaluations: {
          where: { teacherId: id },
          include: {
            student: true,
            topic: true,
          },
        },
      },
    });

    // Add completion status and student count to each session
    const sessionsWithStats = activeSessions.map((session) => {
      // Count students in teacher's anganwadi who haven't been evaluated yet
      const pendingCount = teacher.anganwadi
        ? session.evaluations.filter(
            (evaluation) => evaluation.status === "DRAFT"
          ).length
        : 0;

      const submittedCount = session.evaluations.filter(
        (evaluation) =>
          evaluation.status === "SUBMITTED" || evaluation.status === "GRADED"
      ).length;

      return {
        ...session,
        stats: {
          pendingCount,
          submittedCount,
          totalEvaluations: session.evaluations.length,
        },
      };
    });

    return res.json(sessionsWithStats);
  } catch (error) {
    next(error);
  }
};

// Get teacher evaluations by status
export const getTeacherEvaluationsByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    // Build where clause
    const whereClause: any = { teacherId: id };

    if (status) {
      whereClause.status = status as string;
    }

    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        student: true,
        topic: true,
        cohort: true,
        studentResponses: {
          include: {
            question: true,
            StudentResponseScore: true,
          },
        },
        AssessmentSession: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Add computed properties
    const enhancedEvaluations = evaluations.map((evaluation) => {
      const responseCount = evaluation.studentResponses.length;
      const gradedCount = evaluation.studentResponses.filter(
        (response) =>
          response.StudentResponseScore &&
          response.StudentResponseScore.length > 0
      ).length;

      return {
        ...evaluation,
        stats: {
          responseCount,
          gradedCount,
          completionPercentage:
            responseCount > 0 ? (gradedCount / responseCount) * 100 : 0,
        },
      };
    });

    return res.json(enhancedEvaluations);
  } catch (error) {
    next(error);
  }
};

// Get teacher student responses
export const getTeacherStudentResponses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, evaluationId, studentId } = req.query;

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Get all evaluations for this teacher
    const teacherEvaluations = await prisma.evaluation.findMany({
      where: { teacherId: id },
      select: { id: true },
    });

    const evaluationIds = teacherEvaluations.map((ev) => ev.id);

    // Build filter for student responses
    const whereClause: any = {
      evaluationId: { in: evaluationIds },
    };

    // Add additional filters if provided
    if (evaluationId) {
      whereClause.evaluationId = evaluationId as string;
    }

    if (studentId) {
      whereClause.studentId = studentId as string;
    }

    if (startDate) {
      whereClause.startTime = {
        ...(whereClause.startTime || {}),
        gte: new Date(startDate as string),
      };
    }

    if (endDate) {
      whereClause.endTime = {
        ...(whereClause.endTime || {}),
        lte: new Date(endDate as string),
      };
    }

    // Get student responses with necessary relations
    const responses = await prisma.studentResponse.findMany({
      where: whereClause,
      include: {
        student: true,
        question: true,
        evaluation: {
          include: {
            topic: true,
          },
        },
        StudentResponseScore: {
          orderBy: {
            gradedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return res.json(responses);
  } catch (error) {
    next(error);
  }
};

// Get students available for assessment by a teacher
export const getTeacherStudentsForAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;

    // Get teacher with anganwadi
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { anganwadi: true },
    });

    if (!teacher || !teacher.anganwadi) {
      return res.status(404).json({
        error: "Teacher not found or not assigned to an Anganwadi",
      });
    }

    // Get students in teacher's anganwadi
    const students = await prisma.student.findMany({
      where: {
        anganwadiId: teacher.anganwadi.id,
        status: "ACTIVE",
      },
    });

    // If sessionId provided, check which students are already evaluated
    if (sessionId) {
      const existingEvaluations = await prisma.evaluation.findMany({
        where: {
          teacherId: id,
          AssessmentSession: {
            some: { id: sessionId as string },
          },
        },
        select: { studentId: true },
      });

      const evaluatedStudentIds = new Set(
        existingEvaluations.map((evaluation) => evaluation.studentId)
      );

      // Mark students as evaluated or not
      const studentsWithStatus = students.map((student) => ({
        ...student,
        alreadyEvaluated: evaluatedStudentIds.has(student.id),
      }));

      return res.json(studentsWithStatus);
    }

    return res.json(students);
  } catch (error) {
    next(error);
  }
};

// Get teacher performance summary
export const getTeacherPerformanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Get teacher
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        anganwadi: true,
        cohort: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Get evaluations with responses and scores
    const evaluations = await prisma.evaluation.findMany({
      where: { teacherId: id },
      include: {
        topic: true,
        student: true,
        studentResponses: {
          include: {
            StudentResponseScore: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalEvaluations = evaluations.length;
    const submittedEvaluations = evaluations.filter(
      (e) => e.status === "SUBMITTED" || e.status === "GRADED"
    ).length;

    const draftEvaluations = evaluations.filter(
      (e) => e.status === "DRAFT"
    ).length;

    const gradedEvaluations = evaluations.filter(
      (e) => e.status === "GRADED"
    ).length;

    // Calculate by week
    interface WeekData {
      count: number;
      submitted: number;
      graded: number;
    }

    const weeklyData: Record<number, WeekData> = {};

    evaluations.forEach((evaluation) => {
      const week = evaluation.weekNumber;

      if (!weeklyData[week]) {
        weeklyData[week] = {
          count: 0,
          submitted: 0,
          graded: 0,
        };
      }

      weeklyData[week].count++;

      if (evaluation.status === "SUBMITTED" || evaluation.status === "GRADED") {
        weeklyData[week].submitted++;
      }

      if (evaluation.status === "GRADED") {
        weeklyData[week].graded++;
      }
    });

    // Get unique students evaluated
    const uniqueStudentIds = new Set();
    evaluations.forEach((e) => uniqueStudentIds.add(e.studentId));

    const summary = {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        phone: teacher.phone,
        anganwadi: teacher.anganwadi?.name || null,
        cohort: teacher.cohort?.name || null,
      },
      stats: {
        totalEvaluations,
        submittedEvaluations,
        draftEvaluations,
        gradedEvaluations,
        uniqueStudentsCount: uniqueStudentIds.size,
        completionRate:
          totalEvaluations > 0
            ? (submittedEvaluations / totalEvaluations) * 100
            : 0,
      },
      weeklyData: Object.entries(weeklyData).map(([week, data]) => ({
        week: Number(week),
        count: data.count,
        submitted: data.submitted,
        graded: data.graded,
      })),
    };

    return res.json(summary);
  } catch (error) {
    next(error);
  }
};
