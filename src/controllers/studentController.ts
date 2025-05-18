import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { Gender } from "@prisma/client";

// ✅ Create a Student
export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, gender, status, anganwadiId } = req.body;

    const validGenders = ["MALE", "FEMALE", "OTHER"];

    if (!name || !gender || !status) {
      return res
        .status(400)
        .json({ error: "Name, gender, and status are required" });
    }

    if (!validGenders.includes(gender)) {
      return res.status(400).json({ error: "Invalid gender value" });
    }

    const student = await prisma.student.create({
      data: {
        name,
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
    const search = req.query.search as string;
    const ids = req.query.ids as string;

    // If IDs are provided, fetch those specific students
    if (ids && ids.length > 0) {
      const studentIds = ids.split(',');
      const students = await prisma.student.findMany({
        where: {
          id: { in: studentIds }
        },
        select: {
          id: true,
          name: true,
          gender: true,
        }
      });
      return res.json(students);
    }

    // If search term is provided, use the existing search logic
    if (search && search.length > 0) {
      const validGenders = ["MALE", "FEMALE", "OTHER"];
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            ...(validGenders.includes(search)
              ? [{ gender: { equals: search as Gender } }]
              : []),
          ],
        },
        select: {
          id: true,
          name: true,
          gender: true,
        }
      });
      return res.json(students);
    }

    // Otherwise, get all students
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

// Update a Student
export const updateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, gender, status, anganwadiId } = req.body;

    // Check if the student exists
    const studentExists = await prisma.student.findUnique({
      where: { id },
    });

    if (!studentExists) {
      return res.status(404).json({ error: "Student not found" });
    }

    // If updating gender, validate it
    if (gender) {
      const validGenders = ["MALE", "FEMALE", "OTHER"];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: "Invalid gender value" });
      }
    }

    // If updating status, validate it
    if (status) {
      const validStatuses = ["ACTIVE", "INACTIVE"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
    }

    // Update the student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        name,
        gender,
        status,
        anganwadiId,
      },
      include: { anganwadi: true },
    });

    return res.json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
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
    const { name, anganwadiName } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required to search" });
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
        name: { contains: name, mode: "insensitive" },
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

// Get all evaluations for a student
export const getStudentEvaluations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId } = req.params;

    const evaluations = await prisma.evaluation.findMany({
      where: { studentId },
      include: {
        teacher: true,
        topic: true,
        studentResponses: {
          include: {
            StudentResponseScore: true,
            question: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate performance metrics
    const evaluationStats = evaluations.map((evaluation) => {
      let totalScore = 0;
      let maxPossibleScore = 0;
      let scoredResponses = 0;

      evaluation.studentResponses.forEach((response) => {
        if (
          response.StudentResponseScore &&
          response.StudentResponseScore.length > 0
        ) {
          // Use the most recent score if multiple exist
          const latestScore = response.StudentResponseScore.reduce(
            (latest, current) => {
              return new Date(current.gradedAt) > new Date(latest.gradedAt)
                ? current
                : latest;
            },
            response.StudentResponseScore[0]
          );

          totalScore += latestScore.score;
          maxPossibleScore += 5; // Assuming max score is 5
          scoredResponses++;
        }
      });

      const percentComplete =
        evaluation.studentResponses.length > 0
          ? (scoredResponses / evaluation.studentResponses.length) * 100
          : 0;

      return {
        ...evaluation,
        metrics: {
          totalScore,
          averageScore: scoredResponses > 0 ? totalScore / scoredResponses : 0,
          percentComplete,
          responsesGraded: scoredResponses,
          totalResponses: evaluation.studentResponses.length,
        },
      };
    });

    return res.status(200).json(evaluationStats);
  } catch (error) {
    next(error);
  }
};

// Get student performance summary
export const getStudentPerformanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId } = req.params;

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        anganwadi: true,
        evaluations: {
          include: {
            topic: true,
            studentResponses: {
              include: {
                StudentResponseScore: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Calculate overall stats
    const totalEvaluations = student.evaluations.length;
    let totalResponses = 0;
    let totalScoredResponses = 0;
    let totalScoreSum = 0;

    // Calculate topic-wise performance
    interface TopicPerformance {
      topicName: string;
      evaluationCount: number;
      totalScore: number;
      totalResponses: number;
      scoredResponses: number;
      averageScore?: number;
      completionRate?: number;
    }

    const topicPerformance: Record<string, TopicPerformance> = {};

    student.evaluations.forEach((evaluation) => {
      // Add topic to tracking if not already there
      if (!topicPerformance[evaluation.topicId]) {
        topicPerformance[evaluation.topicId] = {
          topicName: evaluation.topic.name,
          evaluationCount: 0,
          totalScore: 0,
          totalResponses: 0,
          scoredResponses: 0,
        };
      }

      topicPerformance[evaluation.topicId].evaluationCount++;

      // Process responses and scores
      evaluation.studentResponses.forEach((response) => {
        totalResponses++;
        topicPerformance[evaluation.topicId].totalResponses++;

        if (
          response.StudentResponseScore &&
          response.StudentResponseScore.length > 0
        ) {
          // Get the highest/latest score
          const latestScore = response.StudentResponseScore.reduce(
            (latest, current) => {
              return new Date(current.gradedAt) > new Date(latest.gradedAt)
                ? current
                : latest;
            },
            response.StudentResponseScore[0]
          );

          totalScoredResponses++;
          totalScoreSum += latestScore.score;

          topicPerformance[evaluation.topicId].scoredResponses++;
          topicPerformance[evaluation.topicId].totalScore += latestScore.score;
        }
      });
    });

    // Calculate averages for topics
    Object.keys(topicPerformance).forEach((topicId) => {
      const topic = topicPerformance[topicId];
      topic.averageScore =
        topic.scoredResponses > 0
          ? topic.totalScore / topic.scoredResponses
          : 0;
      topic.completionRate =
        topic.totalResponses > 0
          ? (topic.scoredResponses / topic.totalResponses) * 100
          : 0;
    });

    // Format the performance summary
    const performanceSummary = {
      student: {
        id: student.id,
        name: student.name,
        anganwadi: student.anganwadi ? student.anganwadi.name : null,
      },
      overallStats: {
        totalEvaluations,
        completedEvaluations: student.evaluations.filter(
          (e) => e.status === "GRADED"
        ).length,
        averageScore:
          totalScoredResponses > 0 ? totalScoreSum / totalScoredResponses : 0,
        totalResponses,
        gradedResponses: totalScoredResponses,
        completionRate:
          totalResponses > 0
            ? (totalScoredResponses / totalResponses) * 100
            : 0,
      },
      topicPerformance: Object.values(topicPerformance),
    };

    return res.status(200).json(performanceSummary);
  } catch (error) {
    next(error);
  }
};

// Get students eligible for assessment
export const getStudentsForAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { anganwadiId, sessionId } = req.query;

    // Build the query based on provided filters
    const whereClause: any = { status: "ACTIVE" };

    if (anganwadiId) {
      whereClause.anganwadiId = anganwadiId as string;
    }

    // Get all active students matching the criteria
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        anganwadi: true,
        evaluations: sessionId
          ? {
              where: {
                AssessmentSession: {
                  some: { id: sessionId as string },
                },
              },
            }
          : true,
      },
    });

    // If sessionId is provided, mark students who have already been assessed
    const studentsWithAssessmentStatus = students.map((student) => ({
      ...student,
      alreadyAssessed: sessionId ? student.evaluations.length > 0 : false,
    }));

    return res.status(200).json(studentsWithAssessmentStatus);
  } catch (error) {
    next(error);
  }
};

