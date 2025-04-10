import express from "express";
import multer from "multer";
import {
  createQuestion,
  getQuestionsByTopic,
  getQuestionsByAssessmentSession,
  batchCreateQuestions,
  getAllQuestions,
  getQuestionWithStats,
  getQuestionById
} from "../controllers/questionController";

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

export default router;
