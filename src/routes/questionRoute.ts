import express from "express";
import multer from "multer";
import {
  createQuestion,
  getQuestionsByTopic,
  getQuestionsByAssessmentSession,
  batchCreateQuestions,
  getAllQuestions,
  getQuestionWithStats,
  getQuestionById,
} from "../controllers/questionController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { uploadToCloudinary } from "../utils/cloudinary";
import fs from "fs";
import type { Response } from "express";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// ✅ Create a question with image and audio (multipart/form-data)
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  createQuestion
);

// Batch create questions (without file uploads)
router.post("/batch", batchCreateQuestions);

// Get all questions with optional filters
router.get("/", getAllQuestions);

// ✅ Get questions by topicId (specific route first)
router.get("/topic/:topicId", getQuestionsByTopic);

// Get questions for an assessment session (specific route first)
router.get("/session/:sessionId", getQuestionsByAssessmentSession);

// Get question with statistics (specific route)
router.get("/:id/stats", getQuestionWithStats);

// Get a single question by ID (generic route last)
router.get("/:id", getQuestionById);

// Add a route for audio uploads
router.post(
  "/upload-audio",
  authMiddleware(["TEACHER", "ADMIN"]),
  upload.fields([{ name: "file", maxCount: 1 }]),
  async (req: FileRequest, res: Response) => {
    try {
      const audioFile = req.files?.file?.[0];

      if (!audioFile) {
        return res.status(400).json({ message: "Audio file is required." });
      }

      // Upload to Cloudinary
      const audioUpload = await uploadToCloudinary(audioFile.path, "audio");

      // Clean up local file
      fs.unlinkSync(audioFile.path);

      res.status(200).json({
        message: "Audio uploaded successfully",
        audioUrl: audioUpload.secure_url,
      });
    } catch (error) {
      console.error("❌ Error uploading audio:", error);
      res.status(500).json({ message: "Failed to upload audio" });
    }
  }
);

export default router;
