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

      validTeachers = existingTeachers.map((t: { id: string }) => ({
        id: t.id,
      }));

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

// Calculate and update teacher rankings within a cohort
export const updateTeacherRankings = async (
  req: Request<{ cohortId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cohortId } = req.params;

    // Verify cohort exists
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: { teachers: true },
    });

    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Get all teachers in this cohort
    const teacherIds = cohort.teachers.map(
      (teacher: { id: string }) => teacher.id
    );

    if (teacherIds.length === 0) {
      return res.status(400).json({ error: "No teachers in this cohort" });
    }

    // Calculate average scores for each teacher
    const teacherScores = await Promise.all(
      teacherIds.map(async (teacherId: string) => {
        // Get all student responses for this teacher through evaluations
        const evaluationResponses = await prisma.studentResponse.findMany({
          where: {
            evaluation: {
              teacherId,
              cohortId,
            },
            StudentResponseScore: {
              some: {}, // Has at least one score
            },
          },
          include: {
            StudentResponseScore: {
              orderBy: {
                gradedAt: "desc",
              },
              take: 1, // Get only the most recent score
            },
          },
        });

        // Also get responses from student submissions
        const submissionResponses = await prisma.studentResponse.findMany({
          where: {
            studentSubmission: {
              teacherId,
              student: {
                cohortId,
              },
            },
            StudentResponseScore: {
              some: {}, // Has at least one score
            },
          },
          include: {
            StudentResponseScore: {
              orderBy: {
                gradedAt: "desc",
              },
              take: 1,
            },
          },
        });

        // Combine all responses
        const allResponses = [...evaluationResponses, ...submissionResponses];

        // Calculate average score
        const totalScores = allResponses.reduce(
          (sum: number, response: any) => {
            if (response.StudentResponseScore.length > 0) {
              return sum + response.StudentResponseScore[0].score;
            }
            return sum;
          },
          0
        );

        const averageScore =
          allResponses.length > 0 ? totalScores / allResponses.length : 0;

        // Get teacher data
        const teacher = await prisma.teacher.findUnique({
          where: { id: teacherId },
          include: { anganwadi: true },
        });

        return {
          teacherId,
          name: teacher?.name,
          anganwadi: teacher?.anganwadi,
          averageScore,
          responseCount: allResponses.length,
        };
      })
    );

    // Sort teachers by response count and average score (highest to lowest)
    const sortedTeachers = [...teacherScores]
      .filter((teacher) => teacher.responseCount > 0) // Only rank teachers with responses
      .sort((a, b) => {
        // Primary sort by average score
        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
        }
        // Secondary sort by response count
        return b.responseCount - a.responseCount;
      });

    // Update ranks in database
    await Promise.all(
      sortedTeachers.map(async (teacher, index) => {
        await prisma.teacher.update({
          where: { id: teacher.teacherId },
          data: { rank: index + 1 }, // Ranks start at 1
        });
      })
    );

    // Ensure teachers with no responses have rank 0
    await Promise.all(
      teacherScores
        .filter((teacher) => teacher.responseCount === 0)
        .map(async (teacher) => {
          await prisma.teacher.update({
            where: { id: teacher.teacherId },
            data: { rank: 0 },
          });
        })
    );

    // Get updated teacher list with ranks and include response counts
    const updatedTeachers = await prisma.teacher.findMany({
      where: { cohortId },
      include: { anganwadi: true },
      orderBy: { rank: "asc" },
    });

    // Add the response counts to the returned teachers
    const teachersWithStats = updatedTeachers.map((teacher) => {
      const stats = teacherScores.find((t) => t.teacherId === teacher.id);
      return {
        ...teacher,
        stats: {
          responseCount: stats?.responseCount || 0,
          averageScore: stats?.averageScore || 0,
        },
      };
    });

    // Sort by rank, with rank 0 teachers at the end
    const sortedTeachersWithStats = teachersWithStats.sort((a, b) => {
      if (a.rank === 0) return 1;
      if (b.rank === 0) return -1;
      return a.rank - b.rank;
    });

    return res.json({
      message: "Teacher rankings updated successfully",
      teachers: sortedTeachersWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// Get teachers sorted by rank within a cohort
export const getTeacherRankings = async (
  req: Request<{ cohortId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cohortId } = req.params;

    // Verify cohort exists
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    // Get all teachers in this cohort sorted by rank
    const teachers = await prisma.teacher.findMany({
      where: {
        cohortId,
      },
      include: { anganwadi: true },
      orderBy: { rank: "asc" },
    });

    // Get statistics for each teacher
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        if (!teacher.anganwadiId) {
          return {
            ...teacher,
            stats: {
              responseCount: 0,
              averageScore: 0,
              anganwadiResponses: 0,
            },
            rank: 0,
          };
        }

        // Get anganwadi response count
        const anganwadiStats = await prisma.studentResponse.count({
          where: {
            student: {
              anganwadiId: teacher.anganwadiId,
            },
          },
        });

        // Get all student responses for this teacher through evaluations
        const evaluationResponses = await prisma.studentResponse.findMany({
          where: {
            evaluation: {
              teacherId: teacher.id,
              cohortId,
            },
            StudentResponseScore: {
              some: {}, // Has at least one score
            },
          },
          include: {
            StudentResponseScore: {
              orderBy: {
                gradedAt: "desc",
              },
              take: 1,
            },
          },
        });

        // Also get responses from student submissions
        const submissionResponses = await prisma.studentResponse.findMany({
          where: {
            studentSubmission: {
              teacherId: teacher.id,
              student: {
                cohortId,
              },
            },
            StudentResponseScore: {
              some: {}, // Has at least one score
            },
          },
          include: {
            StudentResponseScore: {
              orderBy: {
                gradedAt: "desc",
              },
              take: 1,
            },
          },
        });

        // Combine all responses
        const allResponses = [...evaluationResponses, ...submissionResponses];

        // Calculate average score
        const totalScores = allResponses.reduce(
          (sum: number, response: any) => {
            if (response.StudentResponseScore.length > 0) {
              return sum + response.StudentResponseScore[0].score;
            }
            return sum;
          },
          0
        );

        const averageScore =
          allResponses.length > 0 ? totalScores / allResponses.length : 0;

        return {
          ...teacher,
          stats: {
            responseCount: allResponses.length,
            averageScore,
            anganwadiResponses: anganwadiStats,
          },
          rank: 0, // Will be calculated below
        };
      })
    );

    // Sort teachers by anganwadi response count (descending) and assign ranks
    const sortedTeachers = teachersWithStats
      .sort((a, b) => {
        // Sort by anganwadi responses first (higher responses = higher rank)
        const responsesDiff =
          b.stats.anganwadiResponses - a.stats.anganwadiResponses;
        if (responsesDiff !== 0) return responsesDiff;

        // If responses are equal, sort by average score
        return b.stats.averageScore - a.stats.averageScore;
      })
      .map((teacher, index) => ({
        ...teacher,
        rank: index + 1, // Assign ranks based on sorted position (1-based)
      }));

    return res.json(sortedTeachers);
  } catch (error) {
    next(error);
  }
};

export const getCohortTeacherRankings = async (req: Request, res: Response) => {
  try {
    const cohortId = req.params.cohortId;
    const assessmentId = req.query.assessmentId as string;

    if (!assessmentId) {
      return res.status(400).json({ error: "assessmentId query parameter is required" });
    }

    // Get all teachers in the cohort with their anganwadi and student submissions
    const teachers = await prisma.teacher.findMany({
      where: {
        cohortId: cohortId,
      },
      include: {
        anganwadi: true,
        studentSubmissions: true,
      },
    });

    // Get the assessment session
    const assessment = await prisma.assessmentSession.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        anganwadiAssessments: {
          include: {
            anganwadi: true,
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Get rankings for each teacher
    const teacherRankings = await Promise.all(
      teachers.map(async (teacher) => {
        // Get student responses through student submissions
        const studentResponses = await prisma.studentResponse.count({
          where: {
            studentSubmission: {
              teacherId: teacher.id,
              assessmentSessionId: assessment.id, // Filter by specific assessment
            },
          },
        });

        // Get average scores through student response scores
        const responseScores = await prisma.studentResponseScore.findMany({
          where: {
            studentResponse: {
              studentSubmission: {
                teacherId: teacher.id,
                assessmentSessionId: assessment.id, // Filter by specific assessment
              },
            },
          },
          select: {
            score: true,
          },
        });

        const averageScore =
          responseScores.length > 0
            ? responseScores.reduce((acc, curr) => acc + curr.score, 0) /
              responseScores.length
            : 0;

        // Get anganwadi responses if teacher has an anganwadi
        let anganwadiResponses = 0;
        let assessmentResponseRate = 0;

        if (teacher.anganwadiId) {
          // Get regular anganwadi responses for this assessment
          anganwadiResponses = await prisma.studentResponse.count({
            where: {
              studentSubmission: {
                anganwadiId: teacher.anganwadiId,
                assessmentSessionId: assessment.id, // Filter by specific assessment
              },
            },
          });

          // Get assessment response rate for this anganwadi
          const totalStudents = await prisma.student.count({
            where: {
              anganwadiId: teacher.anganwadiId,
            },
          });

          const assessmentSubmissions = await prisma.studentSubmission.count({
            where: {
              assessmentSessionId: assessment.id,
              anganwadiId: teacher.anganwadiId,
            },
          });

          assessmentResponseRate =
            totalStudents > 0
              ? (assessmentSubmissions / totalStudents) * 100
              : 0;
        }

        // Calculate weighted score
        // 35% assessment response rate, 35% anganwadi responses, 20% direct responses, 10% average score
        const weightedScore =
          assessmentResponseRate * 0.35 +
          anganwadiResponses * 0.35 +
          studentResponses * 0.2 +
          averageScore * 0.1;

        return {
          id: teacher.id,
          name: teacher.name || "",
          phone: teacher.phone || "",
          anganwadi: teacher.anganwadi
            ? {
                id: teacher.anganwadi.id,
                name: teacher.anganwadi.name,
              }
            : null,
          stats: {
            responseCount: studentResponses,
            averageScore: averageScore,
            totalStudents: teacher.studentSubmissions.length,
            responsesPerStudent:
              teacher.studentSubmissions.length > 0
                ? studentResponses / teacher.studentSubmissions.length
                : 0,
            anganwadiResponses: anganwadiResponses,
            assessmentResponseRate: assessmentResponseRate,
            weightedScore: weightedScore,
          },
        };
      })
    );

    // Sort teachers by weighted score
    const sortedRankings = teacherRankings.sort(
      (a, b) => b.stats.weightedScore - a.stats.weightedScore
    );

    return res.status(200).json({
      assessment: {
        id: assessment.id,
        name: assessment.name,
        startDate: assessment.startDate,
        endDate: assessment.endDate,
      },
      rankings: sortedRankings,
    });
  } catch (error) {
    console.error("Error getting cohort teacher rankings:", error);
    return res.status(500).json({
      error: "Failed to get teacher rankings",
    });
  }
};

export const getCohortAssessments = async (req: Request, res: Response) => {
  try {
    const { cohortId } = req.params;

    // Get all teachers in the cohort to get their anganwadi IDs
    const teachers = await prisma.teacher.findMany({
      where: { cohortId },
      select: { anganwadiId: true },
    });

    const anganwadiIds = teachers
      .map((t) => t.anganwadiId)
      .filter((id): id is string => id !== null);

    // Get all published assessments that have submissions from these anganwadis
    const assessments = await prisma.assessmentSession.findMany({
      where: {
        status: "PUBLISHED",
        anganwadiAssessments: {
          some: {
            anganwadiId: {
              in: anganwadiIds,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: {
          select: {
            studentSubmissions: {
              where: {
                anganwadiId: {
                  in: anganwadiIds,
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

    return res.status(200).json(
      assessments.map((assessment) => ({
        id: assessment.id,
        name: assessment.name,
        startDate: assessment.startDate,
        endDate: assessment.endDate,
        status: assessment.status,
        submissionCount: assessment._count.studentSubmissions,
      }))
    );
  } catch (error) {
    console.error("Error getting cohort assessments:", error);
    return res.status(500).json({ error: "Failed to get cohort assessments" });
  }
};
