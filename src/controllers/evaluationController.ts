import type { Request, Response } from "express";
import prisma from "../config/prisma";
import  cloudinary  from "../utils/cloudinary";
import fs from "fs";
import path from "path";

export const createEvaluation = async (req: Request, res: Response) => {
  try {
    const {
      teacherId,
      studentId,
      topicId,
      weekNumber,
      questions, // array of question IDs
    } = req.body;

    const audioFile = req.files?.audio?.[0]; // assuming you're using multer for multipart/form-data
    const metadataFile = req.files?.metadata?.[0];

    if (!audioFile || !metadataFile) {
      return res.status(400).json({ error: "Audio or metadata file missing." });
    }

    // Upload audio to Cloudinary
    const audioUpload = await cloudinary.uploader.upload(audioFile.path, {
      resource_type: "video",
      folder: "evaluations/audio",
    });

    // Upload metadata JSON to Cloudinary
    const metadataUpload = await cloudinary.uploader.upload(metadataFile.path, {
      resource_type: "raw",
      folder: "evaluations/metadata",
    });

    // Cleanup local files
    fs.unlinkSync(audioFile.path);
    fs.unlinkSync(metadataFile.path);

    // Save to DB
    const evaluation = await prisma.evaluation.create({
      data: {
        teacherId,
        studentId,
        topicId,
        weekNumber: parseInt(weekNumber),
        metadataUrl: metadataUpload.secure_url,
        audioUrl: audioUpload.secure_url,
        questions: {
          connect: questions.map((id: string) => ({ id })),
        },
      },
    });

    res
      .status(201)
      .json({ message: "Evaluation created successfully", evaluation });
  } catch (error) {
    console.error("[Create Evaluation Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEvaluations = async (req: Request, res: Response) => {
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
