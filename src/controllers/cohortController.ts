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

        // Use the teacher's rank from the database
        const rank = teacher.rank || 0;

        return {
          ...teacher,
          stats: {
            responseCount: allResponses.length,
            averageScore,
          },
          rank,
        };
      })
    );

    // Sort the teachers by rank for display
    const sortedTeachers = teachersWithStats.sort((a, b) => {
      if (a.rank === 0) return 1; // Push unranked teachers to the end
      if (b.rank === 0) return -1;
      return a.rank - b.rank; // Otherwise sort by rank asc
    });

    return res.json(sortedTeachers);
  } catch (error) {
    next(error);
  }
};
