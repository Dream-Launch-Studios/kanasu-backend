import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

type AssessmentStats = {
  totalAnganwadis: number;
  completedAnganwadis: number;
  anganwadiCompletionPercentage: number;
  totalStudents: number;
  completedStudents: number;
  studentCompletionPercentage: number;
  gradedStudents: number;
};

type AssessmentWithFullStats = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  status: string;
  topicIds: string[];
  anganwadiAssessments: {
    id: string;
    isComplete: boolean;
    totalStudentCount: number;
    completedStudentCount: number;
    anganwadi: {
      id: string;
      name: string;
    };
    studentSubmissions: {
      id: string;
      responses: {
        id: string;
        StudentResponseScore: {
          id: string;
          score: number;
          gradedAt: Date;
        }[];
      }[];
    }[];
  }[];
  stats: AssessmentStats;
};

/**
 * Create a new global assessment session
 */
export const createGlobalAssessment = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      isActive,
      topicIds,
      anganwadiIds, // Array of anganwadi IDs to include
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !startDate ||
      !endDate ||
      !topicIds ||
      !Array.isArray(topicIds) ||
      !anganwadiIds ||
      !Array.isArray(anganwadiIds)
    ) {
      return res.status(400).json({
        error:
          "Name, start date, end date, topic IDs, and anganwadi IDs are required",
      });
    }

    // Create the assessment session
    const assessmentSession = await prisma.assessmentSession.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : true,
        status: "DRAFT",
        topicIds,
      },
    });

    // Get student counts for each anganwadi
    const anganwadiStudentCounts = await Promise.all(
      anganwadiIds.map(async (anganwadiId) => {
        const count = await prisma.student.count({
          where: {
            anganwadiId,
            status: "ACTIVE",
          },
        });
        return { anganwadiId, count };
      })
    );

    // Create anganwadi assessment entries
    const anganwadiAssessments = await Promise.all(
      anganwadiStudentCounts.map(({ anganwadiId, count }) => {
        return prisma.anganwadiAssessment.create({
          data: {
            assessmentSessionId: assessmentSession.id,
            anganwadiId,
            totalStudentCount: count,
            completedStudentCount: 0,
            isComplete: false,
          },
        });
      })
    );

    // No longer creating student submission records here - will only be created when teachers submit

    res.status(201).json({
      message: "Global assessment created successfully",
      assessmentSession,
      anganwadiAssessments,
    });
  } catch (error) {
    console.error("[Create Global Assessment Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all global assessments with completion statistics
 */
export const getGlobalAssessments = async (_req: Request, res: Response) => {
  try {
    const assessments = await prisma.assessmentSession.findMany({
      include: {
        anganwadiAssessments: {
          include: {
            anganwadi: true,
            studentSubmissions: {
              include: {
                student: true,
                responses: {
                  include: {
                    StudentResponseScore: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        startDate: "desc",
      },
    });

    const assessmentsWithStats = assessments.map((assessment) => {
      // Calculate anganwadi stats
      const totalAnganwadis = assessment.anganwadiAssessments.length;
      const completedAnganwadis = assessment.anganwadiAssessments.filter(
        (a) => a.isComplete
      ).length;

      // Calculate student stats
      const totalStudents = assessment.anganwadiAssessments.reduce(
        (sum, a) => sum + a.totalStudentCount,
        0
      );

      const completedStudents = assessment.anganwadiAssessments.reduce(
        (sum, a) => sum + a.completedStudentCount,
        0
      );

      // Calculate graded students (students whose responses have all been scored)
      const gradedStudents = assessment.anganwadiAssessments.reduce((sum, anganwadi) => {
        const gradedSubmissions = anganwadi.studentSubmissions.filter(submission => 
          submission.responses.length > 0 && submission.responses.every(response => 
            response.StudentResponseScore && response.StudentResponseScore.length > 0
          )
        );
        return sum + gradedSubmissions.length;
      }, 0);

      const result: AssessmentWithFullStats = {
        ...assessment,
        stats: {
          totalAnganwadis,
          completedAnganwadis,
          anganwadiCompletionPercentage: totalAnganwadis
            ? Math.round((completedAnganwadis / totalAnganwadis) * 100)
            : 0,
          totalStudents,
          completedStudents,
          studentCompletionPercentage: totalStudents
            ? Math.round((completedStudents / totalStudents) * 100)
            : 0,
          gradedStudents,
        },
      };
      return result;
    });

    res.status(200).json(assessmentsWithStats);
  } catch (error) {
    console.error("[Get Global Assessments Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get details of a specific global assessment
 */
export const getGlobalAssessmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.assessmentSession.findUnique({
      where: { id },
      include: {
        anganwadiAssessments: {
          include: {
            anganwadi: true,
            studentSubmissions: {
              include: {
                student: true,
                responses: {
                  include: {
                    StudentResponseScore: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Get topics information
    const topics = await prisma.topic.findMany({
      where: {
        id: {
          in: assessment.topicIds,
        },
      },
      include: {
        questions: true,
      },
    });

    // Calculate stats
    const totalAnganwadis = assessment.anganwadiAssessments.length;
    const completedAnganwadis = assessment.anganwadiAssessments.filter(
      (a) => a.isComplete
    ).length;

    const totalStudents = assessment.anganwadiAssessments.reduce(
      (sum, a) => sum + a.totalStudentCount,
      0
    );
    const completedStudents = assessment.anganwadiAssessments.reduce(
      (sum, a) => sum + a.completedStudentCount,
      0
    );

    // Calculate graded students count
    const gradedStudents = assessment.anganwadiAssessments.reduce(
      (sum, anganwadi) => {
        const gradedSubmissions = anganwadi.studentSubmissions.filter(
          (submission) => {
            return submission.responses.every(
              (response) =>
                response.StudentResponseScore &&
                response.StudentResponseScore.length > 0
            );
          }
        );
        return sum + gradedSubmissions.length;
      },
      0
    );

    const result = {
      ...assessment,
      topics,
      stats: {
        totalAnganwadis,
        completedAnganwadis,
        anganwadiCompletionPercentage: totalAnganwadis
          ? Math.round((completedAnganwadis / totalAnganwadis) * 100)
          : 0,
        totalStudents,
        completedStudents,
        studentCompletionPercentage: totalStudents
          ? Math.round((completedStudents / totalStudents) * 100)
          : 0,
        gradedStudents,
      },
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("[Get Global Assessment Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get submissions for a specific anganwadi in a global assessment
 */
export const getAnganwadiSubmissions = async (req: Request, res: Response) => {
  try {
    const { assessmentId, anganwadiId } = req.params;

    const submissions = await prisma.studentSubmission.findMany({
      where: {
        assessmentSessionId: assessmentId,
        anganwadiId,
      },
      include: {
        student: true,
        teacher: true,
        responses: {
          include: {
            question: true,
            StudentResponseScore: true,
          },
        },
      },
    });

    res.status(200).json(submissions);
  } catch (error) {
    console.error("[Get Anganwadi Submissions Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Start or record a student's submission for a global assessment
 */
export const recordStudentSubmission = async (req: Request, res: Response) => {
  try {
    const { assessmentId, studentId } = req.params;
    const { teacherId, anganwadiId, responses } = req.body;

    // Validate required fields
    if (!teacherId || !anganwadiId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({
        error: "Teacher ID, anganwadi ID, and responses are required",
      });
    }

    // Check if the assessment exists
    const assessment = await prisma.assessmentSession.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Check if the anganwadi is part of this assessment
    const anganwadiAssessment = await prisma.anganwadiAssessment.findUnique({
      where: {
        assessmentSessionId_anganwadiId: {
          assessmentSessionId: assessmentId,
          anganwadiId,
        },
      },
    });

    if (!anganwadiAssessment) {
      return res
        .status(404)
        .json({ error: "This anganwadi is not part of this assessment" });
    }

    // Verify that the student belongs to this anganwadi
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.anganwadiId !== anganwadiId) {
      return res.status(400).json({
        error: "Student does not belong to the specified anganwadi",
      });
    }

    // Check for existing submission
    const existingSubmission = await prisma.studentSubmission.findFirst({
      where: {
        assessmentSessionId: assessmentId,
        studentId,
      },
    });

    if (existingSubmission) {
      return res.status(400).json({
        error: "Student has already submitted for this assessment",
      });
    }

    // Create a new student submission record
    const studentSubmission = await prisma.studentSubmission.create({
      data: {
        assessmentSessionId: assessmentId,
        anganwadiId,
        studentId,
        teacherId,
        // These now default to COMPLETED and current timestamp
        responses: {
          createMany: {
            data: responses.map((response: any) => ({
              questionId: response.questionId,
              studentId,
              startTime: new Date(response.startTime),
              endTime: new Date(response.endTime),
              audioUrl: response.audioUrl,
              evaluationId: response.evaluationId, // Can be null for direct submissions
            })),
          },
        },
      },
    });

    // Update anganwadi completion count
    await prisma.anganwadiAssessment.update({
      where: {
        id: anganwadiAssessment.id,
      },
      data: {
        completedStudentCount: {
          increment: 1,
        },
      },
    });

    // Check if all students in this anganwadi have completed
    const updatedAnganwadiAssessment =
      await prisma.anganwadiAssessment.findUnique({
        where: {
          id: anganwadiAssessment.id,
        },
      });

    // Mark anganwadi as complete if all students have submitted
    if (
      updatedAnganwadiAssessment &&
      updatedAnganwadiAssessment.completedStudentCount >=
        updatedAnganwadiAssessment.totalStudentCount
    ) {
      await prisma.anganwadiAssessment.update({
        where: {
          id: anganwadiAssessment.id,
        },
        data: {
          isComplete: true,
        },
      });
    }

    res.status(200).json({
      message: "Student submission recorded successfully",
      submission: studentSubmission,
    });
  } catch (error) {
    console.error("[Record Student Submission Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Publish a global assessment (change status from DRAFT to PUBLISHED)
 */
export const publishGlobalAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.assessmentSession.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    if (assessment.status !== "DRAFT") {
      return res
        .status(400)
        .json({ error: "Only draft assessments can be published" });
    }

    const updatedAssessment = await prisma.assessmentSession.update({
      where: { id },
      data: {
        status: "PUBLISHED",
      },
    });

    res.status(200).json({
      message: "Assessment published successfully",
      assessment: updatedAssessment,
    });
  } catch (error) {
    console.error("[Publish Assessment Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Complete a global assessment (change status to COMPLETED)
 */
export const completeGlobalAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.assessmentSession.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    if (assessment.status !== "PUBLISHED") {
      return res
        .status(400)
        .json({ error: "Only published assessments can be completed" });
    }

    const updatedAssessment = await prisma.assessmentSession.update({
      where: { id },
      data: {
        status: "COMPLETED",
        isActive: false,
      },
    });

    res.status(200).json({
      message: "Assessment marked as completed",
      assessment: updatedAssessment,
    });
  } catch (error) {
    console.error("[Complete Assessment Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get active assessments for a specific anganwadi
 */
export const getActiveAssessmentsForAnganwadi = async (
  req: Request,
  res: Response
) => {
  try {
    const { anganwadiId } = req.query;

    if (!anganwadiId) {
      return res.status(400).json({ error: "Anganwadi ID is required" });
    }

    const now = new Date();

    // Find active assessments that include this anganwadi
    const assessments = await prisma.assessmentSession.findMany({
      where: {
        isActive: true,
        status: "PUBLISHED",
        startDate: { lte: now },
        endDate: { gte: now },
        anganwadiAssessments: {
          some: {
            anganwadiId: anganwadiId as string,
          },
        },
      },
      include: {
        anganwadiAssessments: {
          where: {
            anganwadiId: anganwadiId as string,
          },
        },
      },
    });

    // Fetch topics and questions for these assessments
    const assessmentsWithTopics = await Promise.all(
      assessments.map(async (assessment) => {
        const topics = await prisma.topic.findMany({
          where: {
            id: {
              in: assessment.topicIds,
            },
          },
          include: {
            questions: true,
          },
        });

        return {
          ...assessment,
          topics,
        };
      })
    );

    res.status(200).json(assessmentsWithTopics);
  } catch (error) {
    console.error("[Get Active Assessments For Anganwadi Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a specific submission by ID
 */
export const getSubmissionById = async (req: Request, res: Response) => {
  try {
    const { assessmentId, submissionId } = req.params;

    // First check if the assessment exists
    const assessment = await prisma.assessmentSession.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Get the submission with related data
    const submission = await prisma.studentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: true,
        teacher: true,
        responses: {
          include: {
            question: true,
            StudentResponseScore: {
              orderBy: {
                gradedAt: "desc",
              },
              take: 1,
            },
          },
        },
        assessmentSession: true,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Verify this submission belongs to the specified assessment
    if (submission.assessmentSessionId !== assessmentId) {
      return res
        .status(404)
        .json({ error: "Submission not found in this assessment" });
    }

    res.status(200).json(submission);
  } catch (error) {
    console.error("[Get Submission By ID Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
