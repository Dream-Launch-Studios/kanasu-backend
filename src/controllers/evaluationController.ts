import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { uploadToCloudinary } from "../utils/cloudinary";
import fs from "fs";

interface FileRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

export const createEvaluation = async (req: FileRequest, res: Response) => {
  try {
    const {
      teacherId,
      studentId,
      topicId,
      weekNumber,
      questions, // JSON string of question IDs
      cohortId,
      metadata, // ✅ JSON string
      assessmentSessionId, // New field
    } = req.body;

    const audioFile = req.files?.audio?.[0];

    if (!audioFile || !metadata) {
      return res
        .status(400)
        .json({ error: "Audio file and metadata are required." });
    }

    // Upload audio to Cloudinary
    const audioUpload = await uploadToCloudinary(audioFile.path, "audio");
    fs.unlinkSync(audioFile.path); // Clean up

    const metadataJson = JSON.parse(metadata); // ✅ Now parsing from req.body

    // Upload metadata to Cloudinary as raw string
    const metadataBlob = Buffer.from(JSON.stringify(metadataJson));
    const metadataPath = `temp_${Date.now()}.json`;
    fs.writeFileSync(metadataPath, metadataBlob);

    const metadataUpload = await uploadToCloudinary(metadataPath, "metadata");
    fs.unlinkSync(metadataPath); // Clean up

    // Create evaluation with assessment session connection if provided
    let evaluationData = {
      teacherId,
      studentId,
      topicId,
      weekNumber: parseInt(weekNumber),
      cohortId: cohortId || null,
      metadataUrl: metadataUpload.secure_url,
      audioUrl: audioUpload.secure_url,
      questions: {
        connect: JSON.parse(questions).map((id: string) => ({ id })),
      },
    };

    // Create the evaluation
    const evaluation = await prisma.evaluation.create({
      data: evaluationData,
    });

    // Connect to assessment session if provided
    if (assessmentSessionId) {
      await prisma.assessmentSession.update({
        where: { id: assessmentSessionId },
        data: {
          evaluations: {
            connect: { id: evaluation.id }
          }
        }
      });
    }

    // Create student responses
    if (Array.isArray(metadataJson.responses)) {
      for (const response of metadataJson.responses) {
        await prisma.studentResponse.create({
          data: {
            evaluationId: evaluation.id,
            studentId,
            questionId: response.questionId,
            startTime: new Date(response.startTime),
            endTime: new Date(response.endTime),
            audioUrl: response.audioUrl ?? audioUpload.secure_url,
          },
        });
      }
    }

    res
      .status(201)
      .json({ message: "Evaluation created successfully", evaluation });
  } catch (error) {
    console.error("[Create Evaluation Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get all evaluations
export const getEvaluations = async (_req: Request, res: Response) => {
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        teacher: true,
        student: true,
        topic: true,
        questions: true,
      },
    });

    res.status(200).json(evaluations);
  } catch (error) {
    console.error("[Get Evaluations Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get evaluation by ID
export const getEvaluationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        teacher: true,
        student: true,
        topic: true,
        questions: true,
        studentResponses: true,
      },
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    res.status(200).json(evaluation);
  } catch (error) {
    console.error("[Get Evaluation By ID Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New function to submit an evaluation (when teacher completes the assessment)
export const submitEvaluation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find the evaluation
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        studentResponses: true,
      },
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    // Check if all questions have responses
    if (evaluation.studentResponses.length === 0) {
      return res.status(400).json({ 
        error: "Cannot submit an evaluation without student responses" 
      });
    }

    // Update evaluation status to SUBMITTED
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    res.status(200).json({ 
      message: "Evaluation submitted successfully", 
      evaluation: updatedEvaluation 
    });
  } catch (error) {
    console.error("[Submit Evaluation Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add grading functionality for an evaluation
export const gradeStudentResponse = async (req: Request, res: Response) => {
  try {
    const { responseId } = req.params;
    const { score } = req.body;

    if (!score || typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: "Valid score is required" });
    }

    // Create score for this response
    const responseScore = await prisma.studentResponseScore.create({
      data: {
        studentResponseId: responseId,
        score
      }
    });

    res.status(200).json({ 
      message: "Response graded successfully", 
      responseScore 
    });
  } catch (error) {
    console.error("[Grade Student Response Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark an evaluation as completely graded
export const completeEvaluationGrading = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        status: "GRADED",
        gradingComplete: true,
      },
    });

    res.status(200).json({ 
      message: "Evaluation grading completed", 
      evaluation: updatedEvaluation 
    });
  } catch (error) {
    console.error("[Complete Evaluation Grading Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get evaluations by status (for admin to see submitted evaluations)
export const getEvaluationsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    
    const evaluations = await prisma.evaluation.findMany({
      where: { status },
      include: {
        teacher: true,
        student: true,
        topic: true,
        studentResponses: {
          include: {
            StudentResponseScore: true
          }
        },
      },
    });

    res.status(200).json(evaluations);
  } catch (error) {
    console.error("[Get Evaluations By Status Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get evaluations by Anganwadi
export const getEvaluationsByAnganwadi = async (
  req: Request,
  res: Response
) => {
  try {
    const { anganwadiId } = req.params;

    const evaluations = await prisma.evaluation.findMany({
      where: {
        student: {
          anganwadiId,
        },
      },
      include: {
        teacher: true,
        student: true,
        topic: true,
        studentResponses: true,
      },
    });

    res.status(200).json(evaluations);
  } catch (error) {
    console.error("[Get Evaluations By Anganwadi Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get evaluations by assessment session
export const getEvaluationsBySession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        evaluations: {
          include: {
            teacher: true,
            student: true,
            topic: true,
            studentResponses: true,
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Assessment session not found" });
    }

    res.status(200).json(session.evaluations);
  } catch (error) {
    console.error("[Get Evaluations By Session Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
