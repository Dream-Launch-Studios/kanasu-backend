import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { uploadToCloudinary } from "../utils/cloudinary";

interface FileRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

export const createQuestion = async (req: FileRequest, res: Response) => {
  try {
    const { topicId, text } = req.body;
    const imageFile = req.files?.image?.[0];
    const audioFile = req.files?.audio?.[0];

    if (!imageFile || !audioFile) {
      return res
        .status(400)
        .json({ message: "Image and audio files are required." });
    }

    // Upload to Cloudinary
    const imageUpload = await uploadToCloudinary(imageFile.path, "image");
    const audioUpload = await uploadToCloudinary(audioFile.path, "audio");

    const question = await prisma.question.create({
      data: {
        text,
        topicId,
        imageUrl: imageUpload.secure_url,
        audioUrl: audioUpload.secure_url,
      },
    });

    res.status(201).json(question);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: "Failed to create question" });
  }
};

export const getQuestionsByTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    const questions = await prisma.question.findMany({
      where: { topicId },
    });

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};
