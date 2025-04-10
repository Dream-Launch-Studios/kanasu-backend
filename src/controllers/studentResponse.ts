// controllers/studentResponseController.ts
import type { Request, Response } from "express";
import prisma from "../config/prisma";

// ✅ Create a student response
export const createStudentResponse = async (req: Request, res: Response) => {
  try {
    const {
      evaluationId,
      questionId,
      studentId,
      startTime,
      endTime,
      audioUrl,
    } = req.body;

    const response = await prisma.studentResponse.create({
      data: {
        evaluationId,
        questionId,
        studentId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        audioUrl,
      },
    });

    res.status(201).json({ message: "Response saved", response });
  } catch (error) {
    console.error("❌ Error creating student response:", error);
    res.status(500).json({ error: "Failed to save response" });
  }
};

// Batch create multiple student responses
export const batchCreateStudentResponses = async (req: Request, res: Response) => {
  try {
    const { responses } = req.body;

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: "Responses array is required" });
    }

    // Create all responses in a transaction
    const createdResponses = await prisma.$transaction(
      responses.map(response => {
        const { evaluationId, questionId, studentId, startTime, endTime, audioUrl } = response;
        return prisma.studentResponse.create({
          data: {
            evaluationId,
            questionId,
            studentId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            audioUrl,
          }
        });
      })
    );

    res.status(201).json({ 
      message: `${createdResponses.length} responses saved successfully`, 
      responses: createdResponses 
    });
  } catch (error) {
    console.error("❌ Error creating batch student responses:", error);
    res.status(500).json({ error: "Failed to save responses" });
  }
};

// ✅ Get all student responses for a student
export const getResponsesByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const responses = await prisma.studentResponse.findMany({
      where: { studentId },
      include: {
        question: true,
        evaluation: true,
        StudentResponseScore: true
      },
    });

    res.json(responses);
  } catch (error) {
    console.error("❌ Error fetching responses:", error);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
};

// ✅ Get all student responses for an evaluation
export const getResponsesByEvaluation = async (req: Request, res: Response) => {
  try {
    const { evaluationId } = req.params;

    const responses = await prisma.studentResponse.findMany({
      where: { evaluationId },
      include: {
        question: true,
        student: true,
        StudentResponseScore: true
      },
    });

    res.json(responses);
  } catch (error) {
    console.error("❌ Error fetching responses:", error);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
};

// Get all responses with their scores
export const getScoredResponses = async (req: Request, res: Response) => {
  try {
    const { evaluationId } = req.query;
    
    // Build where clause based on provided filters
    const whereClause: any = {};
    if (evaluationId) {
      whereClause.evaluationId = evaluationId as string;
    }

    // Only get responses that have scores
    const responses = await prisma.studentResponse.findMany({
      where: {
        ...whereClause,
        StudentResponseScore: {
          some: {} // Has at least one score
        }
      },
      include: {
        question: true,
        student: true,
        evaluation: {
          include: {
            topic: true
          }
        },
        StudentResponseScore: {
          orderBy: {
            gradedAt: 'desc'
          }
        }
      },
    });

    res.json(responses);
  } catch (error) {
    console.error("❌ Error fetching scored responses:", error);
    res.status(500).json({ error: "Failed to fetch scored responses" });
  }
};

// Get a specific student response with score
export const getResponseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const response = await prisma.studentResponse.findUnique({
      where: { id },
      include: {
        question: true,
        student: true,
        evaluation: {
          include: {
            topic: true,
            teacher: true
          }
        },
        StudentResponseScore: {
          orderBy: {
            gradedAt: 'desc'
          }
        }
      },
    });

    if (!response) {
      return res.status(404).json({ error: "Student response not found" });
    }

    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching response:", error);
    res.status(500).json({ error: "Failed to fetch response" });
  }
};

// Submit a batch of responses with evaluation metadata at once (for teacher app)
export const submitTeacherBatchResponses = async (req: Request, res: Response) => {
  try {
    const { 
      evaluationData, 
      responses,
      teacherId,
      studentId,
      topicId,
      assessmentSessionId
    } = req.body;

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: "Responses array is required" });
    }

    if (!teacherId || !studentId || !topicId) {
      return res.status(400).json({ error: "Teacher, student, and topic information are required" });
    }

    // Start a transaction to ensure all operations succeed together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the evaluation record first
      const evaluation = await tx.evaluation.create({
        data: {
          teacherId,
          studentId,
          topicId,
          weekNumber: evaluationData?.weekNumber || 1,
          metadataUrl: evaluationData?.metadataUrl || "",
          audioUrl: evaluationData?.audioUrl || "",
          status: "SUBMITTED", // Auto-submit from teacher app
          submittedAt: new Date(),
          // Connect to session if provided
          ...(assessmentSessionId ? {
            AssessmentSession: {
              connect: { id: assessmentSessionId }
            }
          } : {})
        }
      });

      // 2. Create all student responses linked to this evaluation
      const createdResponses = await Promise.all(
        responses.map(async (response: any) => {
          return tx.studentResponse.create({
            data: {
              evaluationId: evaluation.id,
              questionId: response.questionId,
              studentId,
              startTime: new Date(response.startTime || Date.now()),
              endTime: new Date(response.endTime || Date.now()),
              audioUrl: response.audioUrl || "",
            }
          });
        })
      );

      return { evaluation, responses: createdResponses };
    });

    res.status(201).json({ 
      message: "Exam submitted successfully", 
      evaluationId: result.evaluation.id,
      responseCount: result.responses.length
    });
  } catch (error) {
    console.error("❌ Error submitting teacher batch responses:", error);
    res.status(500).json({ error: "Failed to submit exam responses" });
  }
};

// Export student responses as CSV
export const exportResponses = async (req: Request, res: Response) => {
  try {
    const { studentId, evaluationId, startDate, endDate, teacherId } = req.query;

    // Build where clause based on provided filters
    const whereClause: any = {};
    
    if (studentId) {
      whereClause.studentId = studentId as string;
    }
    
    if (evaluationId) {
      whereClause.evaluationId = evaluationId as string;
    }
    
    // If teacher ID provided, only include evaluations from this teacher
    if (teacherId) {
      // Get all evaluations for this teacher
      const teacherEvaluations = await prisma.evaluation.findMany({
        where: { teacherId: teacherId as string },
        select: { id: true }
      });
      
      const evaluationIds = teacherEvaluations.map(ev => ev.id);
      
      // Filter by these evaluation IDs
      whereClause.evaluationId = { in: evaluationIds };
    }
    
    if (startDate) {
      whereClause.createdAt = {
        ...(whereClause.createdAt || {}),
        gte: new Date(startDate as string),
      };
    }
    
    if (endDate) {
      whereClause.createdAt = {
        ...(whereClause.createdAt || {}),
        lte: new Date(endDate as string),
      };
    }

    // Fetch the student responses with necessary relations
    const responses = await prisma.studentResponse.findMany({
      where: whereClause,
      include: {
        student: true,
        question: true,
        evaluation: {
          include: {
            topic: true
          }
        },
        StudentResponseScore: {
          orderBy: {
            gradedAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Create CSV headers
    const headers = [
      'ID',
      'Student Name',
      'Question',
      'Topic',
      'Audio URL',
      'Score',
      'Start Time',
      'End Time'
    ].join(',');

    // Create CSV rows
    const rows = responses.map(response => [
      response.id,
      response.student?.name || 'Unknown Student',
      `"${(response.question?.text || 'Unknown Question').replace(/"/g, '""')}"`,
      `"${(response.evaluation?.topic?.name || 'Unknown Topic').replace(/"/g, '""')}"`,
      response.audioUrl || '',
      response.StudentResponseScore?.length > 0 ? response.StudentResponseScore[0].score + '%' : 'Not scored',
      new Date(response.startTime).toLocaleString(),
      new Date(response.endTime).toLocaleString()
    ].join(','));

    // Combine headers and rows
    const csv = [headers, ...rows].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=student-responses-${new Date().toISOString().slice(0, 10)}.csv`);

    // Send the CSV
    return res.send(csv);
  } catch (error) {
    console.error("❌ Error exporting student responses:", error);
    return res.status(500).json({ error: "Failed to export student responses" });
  }
};
