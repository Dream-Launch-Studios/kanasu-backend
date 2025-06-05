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
      anganwadiIds,
      cohortIds,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !startDate ||
      !endDate ||
      !topicIds ||
      !Array.isArray(topicIds) ||
      (!anganwadiIds || !Array.isArray(anganwadiIds)) &&
      (!cohortIds || !Array.isArray(cohortIds))
    ) {
      return res.status(400).json({
        error:
          "Name, start date, end date, topic IDs, and either anganwadi IDs or cohort IDs are required",
      });
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the assessment session
      const assessmentSession = await tx.assessmentSession.create({
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

      // Collect all anganwadi IDs (both directly selected and from cohorts)
      let allAnganwadiIds: string[] = [...(anganwadiIds || [])];
      
      // If cohort IDs are provided, fetch all anganwadis associated with teachers in those cohorts
      if (cohortIds && cohortIds.length > 0) {
        // Get all teachers in the selected cohorts
        const teachersInCohorts = await tx.teacher.findMany({
          where: {
            cohortId: {
              in: cohortIds,
            },
          },
          select: {
            anganwadiId: true,
          },
        });
        
        // Filter out null anganwadiIds and add to the allAnganwadiIds list
        const cohortAnganwadiIds = teachersInCohorts
          .filter(teacher => teacher.anganwadiId !== null)
          .map(teacher => teacher.anganwadiId as string);
          
        allAnganwadiIds = [...new Set([...allAnganwadiIds, ...cohortAnganwadiIds])];
      }

      // Ensure we have at least one anganwadi
      if (allAnganwadiIds.length === 0) {
        throw new Error("No anganwadis found. Please select at least one anganwadi or cohort with anganwadis.");
      }

      // Get student counts for each anganwadi
      const anganwadiStudentCounts = await Promise.all(
        allAnganwadiIds.map(async (anganwadiId) => {
          // Get all ACTIVE students in the anganwadi
          const students = await tx.student.findMany({
            where: {
              anganwadiId,
              status: "ACTIVE",
            },
            select: {
              id: true,
            },
          });

          return {
            anganwadiId,
            count: students.length,
            studentIds: students.map((s) => s.id),
          };
        })
      );

      // Create anganwadi assessment entries
      const anganwadiAssessments = await Promise.all(
        anganwadiStudentCounts.map(({ anganwadiId, count }) => {
          return tx.anganwadiAssessment.create({
            data: {
              assessmentSessionId: assessmentSession.id,
              anganwadiId,
              totalStudentCount: count,
              completedStudentCount: 0,
              // An anganwadi is complete if it has no students to assess
              // or if all its students have completed their assessments
              isComplete: count === 0,
            },
            include: {
              anganwadi: true,
            },
          });
        })
      );

      return {
        assessmentSession,
        anganwadiAssessments,
        stats: {
          totalAnganwadis: anganwadiAssessments.length,
          completedAnganwadis: anganwadiAssessments.filter((a) => a.isComplete)
            .length,
          totalStudents: anganwadiAssessments.reduce(
            (sum, a) => sum + a.totalStudentCount,
            0
          ),
          completedStudents: 0,
        },
      };
    });

    res.status(201).json({
      message: "Global assessment created successfully",
      assessmentSession: result.assessmentSession,
      anganwadiAssessments: result.anganwadiAssessments,
      stats: result.stats,
    });
  } catch (error) {
    console.error("[Create Global Assessment Error]", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
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
                    StudentResponseScore: true,
                  },
                },
              },
            },
          },
        },
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
      const gradedStudents = assessment.anganwadiAssessments.reduce(
        (sum, anganwadi) => {
          const gradedSubmissions = anganwadi.studentSubmissions.filter(
            (submission) =>
              submission.responses.length > 0 &&
              submission.responses.every(
                (response) =>
                  response.StudentResponseScore &&
                  response.StudentResponseScore.length > 0
              )
          );
          return sum + gradedSubmissions.length;
        },
        0
      );

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

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if the assessment exists and is active
      const assessment = await tx.assessmentSession.findUnique({
        where: {
          id: assessmentId,
          isActive: true,
        },
      });

      if (!assessment) {
        throw new Error("Assessment not found or is not active");
      }

      // Check if the anganwadi is part of this assessment
      const anganwadiAssessment = await tx.anganwadiAssessment.findUnique({
        where: {
          assessmentSessionId_anganwadiId: {
            assessmentSessionId: assessmentId,
            anganwadiId,
          },
        },
        include: {
          anganwadi: {
            include: {
              students: {
                where: {
                  status: "ACTIVE",
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!anganwadiAssessment) {
        throw new Error("This anganwadi is not part of this assessment");
      }

      // Verify that the student belongs to this anganwadi and is active
      const student = await tx.student.findUnique({
        where: {
          id: studentId,
          status: "ACTIVE",
        },
      });

      if (!student || student.anganwadiId !== anganwadiId) {
        throw new Error(
          "Student does not belong to the specified anganwadi or is not active"
        );
      }

      // Check for existing submission
      const existingSubmission = await tx.studentSubmission.findFirst({
        where: {
          assessmentSessionId: assessmentId,
          studentId,
        },
      });

      if (existingSubmission) {
        throw new Error("Student has already submitted for this assessment");
      }

      // Create a new student submission record
      const studentSubmission = await tx.studentSubmission.create({
        data: {
          assessmentSessionId: assessmentId,
          anganwadiId,
          studentId,
          teacherId,
          submissionStatus: "COMPLETED",
          submittedAt: new Date(),
          responses: {
            createMany: {
              data: responses.map((response: any) => ({
                questionId: response.questionId,
                studentId,
                startTime: new Date(response.startTime),
                endTime: new Date(response.endTime),
                audioUrl: response.audioUrl,
                evaluationId: response.evaluationId,
              })),
            },
          },
        },
      });

      // Get the current count of completed submissions for this anganwadi
      const completedSubmissions = await tx.studentSubmission.count({
        where: {
          assessmentSessionId: assessmentId,
          anganwadiId,
          submissionStatus: "COMPLETED",
        },
      });

      // Update anganwadi completion status
      const updatedAssessment = await tx.anganwadiAssessment.update({
        where: {
          id: anganwadiAssessment.id,
        },
        data: {
          completedStudentCount: completedSubmissions,
          isComplete:
            completedSubmissions >= anganwadiAssessment.totalStudentCount,
        },
      });

      return {
        studentSubmission,
        updatedAssessment,
        stats: {
          totalStudents: anganwadiAssessment.totalStudentCount,
          completedStudents: completedSubmissions,
          isComplete:
            completedSubmissions >= anganwadiAssessment.totalStudentCount,
        },
      };
    });

    res.status(200).json({
      message: "Student submission recorded successfully",
      submission: result.studentSubmission,
      stats: result.stats,
    });
  } catch (error) {
    console.error("[Record Student Submission Error]", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
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
      include: {
        anganwadiAssessments: true,
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    if (assessment.status !== "PUBLISHED") {
      return res
        .status(400)
        .json({ error: "Only published assessments can be completed" });
    }

    // Update all anganwadi assessments to complete
    await prisma.$transaction(async (tx) => {
      // First update each anganwadi assessment to complete
      for (const anganwadiAssessment of assessment.anganwadiAssessments) {
        await tx.anganwadiAssessment.update({
          where: { id: anganwadiAssessment.id },
          data: {
            isComplete: true,
            completedStudentCount: anganwadiAssessment.totalStudentCount,
          },
        });
      }

      // Then update the assessment session
      await tx.assessmentSession.update({
        where: { id },
        data: {
          status: "COMPLETED",
          isActive: false,
        },
      });
    });

    // Fetch the updated assessment with stats
    const updatedAssessment = await prisma.assessmentSession.findUnique({
      where: { id },
      include: {
        anganwadiAssessments: {
          include: {
            anganwadi: true,
            studentSubmissions: {
              include: {
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

    // Calculate updated stats
    const totalAnganwadis = updatedAssessment!.anganwadiAssessments.length;
    const completedAnganwadis = updatedAssessment!.anganwadiAssessments.filter(
      (a) => a.isComplete
    ).length;

    const totalStudents = updatedAssessment!.anganwadiAssessments.reduce(
      (sum, a) => sum + a.totalStudentCount,
      0
    );
    const completedStudents = updatedAssessment!.anganwadiAssessments.reduce(
      (sum, a) => sum + a.completedStudentCount,
      0
    );

    const gradedStudents = updatedAssessment!.anganwadiAssessments.reduce(
      (sum, anganwadi) => {
        const gradedSubmissions = anganwadi.studentSubmissions.filter(
          (submission) =>
            submission.responses.every(
              (response) =>
                response.StudentResponseScore &&
                response.StudentResponseScore.length > 0
            )
        );
        return sum + gradedSubmissions.length;
      },
      0
    );

    res.status(200).json({
      message: "Assessment marked as completed",
      assessment: {
        ...updatedAssessment,
        stats: {
          totalAnganwadis,
          completedAnganwadis,
          anganwadiCompletionPercentage: Math.round(
            (completedAnganwadis / totalAnganwadis) * 100
          ),
          totalStudents,
          completedStudents,
          studentCompletionPercentage: Math.round(
            (completedStudents / totalStudents) * 100
          ),
          gradedStudents,
        },
      },
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

// Submit multiple student responses in bulk
export const submitBulkResponses = async (req: Request, res: Response) => {
  try {
    const { responses } = req.body;

    if (!Array.isArray(responses) || responses.length === 0) {
      return res
        .status(400)
        .json({ error: "Valid responses array is required" });
    }

    // Create all responses in a transaction
    const createdResponses = await prisma.$transaction(
      responses.map((response) => {
        const {
          evaluationId,
          questionId,
          studentId,
          startTime,
          endTime,
          audioUrl,
        } = response;

        return prisma.studentResponse.create({
          data: {
            evaluationId: evaluationId || undefined, // Make evaluationId optional
            questionId,
            studentId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            audioUrl,
          },
        });
      })
    );

    res.status(201).json({
      message: `${createdResponses.length} responses submitted successfully`,
      responses: createdResponses,
    });
  } catch (error) {
    console.error("[Submit Bulk Responses Error]", error);
    res.status(500).json({ error: "Failed to submit responses" });
  }
};

/**
 * Download assessment data for offline use
 * This includes all assessment details, topics, questions, and media files
 */
export const downloadAssessmentData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { anganwadiId } = req.query;

    if (!anganwadiId) {
      return res.status(400).json({ error: "Anganwadi ID is required" });
    }

    // Get assessment with all related data
    const assessment = await prisma.assessmentSession.findUnique({
      where: { 
        id,
        anganwadiAssessments: {
          some: {
            anganwadiId: anganwadiId as string,
          }
        }
      },
      include: {
        anganwadiAssessments: {
          where: {
            anganwadiId: anganwadiId as string,
          },
          include: {
            anganwadi: true
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found or not available for this anganwadi" });
    }

    // Get topics with questions
    const topics = await prisma.topic.findMany({
      where: {
        id: {
          in: assessment.topicIds
        }
      },
      select: {
        id: true,
        name: true,
        questions: {
          select: {
            id: true,
            text: true,
            imageUrl: true,
            audioUrl: true,
            answerOptions: true
          }
        }
      }
    });

    // Get students for this anganwadi
    const students = await prisma.student.findMany({
      where: {
        anganwadiId: anganwadiId as string,
        status: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        gender: true
      }
    });

    // Prepare the offline data package
    const offlineData = {
      assessment: {
        id: assessment.id,
        name: assessment.name,
        description: assessment.description,
        startDate: assessment.startDate,
        endDate: assessment.endDate,
        isActive: assessment.isActive,
        status: assessment.status,
        anganwadi: assessment.anganwadiAssessments[0]?.anganwadi,
        downloadedAt: new Date().toISOString()
      },
      topics: topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        questions: topic.questions.map(question => ({
          id: question.id,
          text: question.text,
          imageUrl: question.imageUrl,
          audioUrl: question.audioUrl,
          answerOptions: question.answerOptions
        }))
      })),
      students: students,
      mediaFiles: {
        images: topics.flatMap(topic => 
          topic.questions
            .filter(q => q.imageUrl)
            .map(q => ({
              questionId: q.id,
              url: q.imageUrl,
              type: 'image'
            }))
        ),
        audio: topics.flatMap(topic => 
          topic.questions
            .filter(q => q.audioUrl)
            .map(q => ({
              questionId: q.id,
              url: q.audioUrl,
              type: 'audio'
            }))
        )
      }
    };

    res.status(200).json(offlineData);
  } catch (error) {
    console.error("[Download Assessment Data Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
