import express from "express";
import multer from "multer";
import {
  createQuestion,
  getQuestionsByTopic,
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

// ✅ Get questions by topicId
router.get("/topic/:topicId", getQuestionsByTopic);

export default router;
