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

    // Create evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
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
      },
    });

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

    res.status(201).json({ message: "Evaluation created successfully", evaluation });
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
