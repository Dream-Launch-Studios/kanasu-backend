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
import type { Response, Request } from "express";

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
  //@ts-ignore
  createQuestion
);

// Batch create questions (without file uploads)
//@ts-ignore
router.post("/batch", batchCreateQuestions);

// Get all questions with optional filters
//@ts-ignore
router.get("/", getAllQuestions);

// ✅ Get questions by topicId (specific route first)
//@ts-ignore
router.get("/topic/:topicId", getQuestionsByTopic);

// Get questions for an assessment session (specific route first)
//@ts-ignore
router.get("/session/:sessionId", getQuestionsByAssessmentSession);

// Get question with statistics (specific route)
//@ts-ignore
router.get("/:id/stats", getQuestionWithStats);

// Get a single question by ID (generic route last)
//@ts-ignore
router.get("/:id", getQuestionById);

// Add a route for audio uploads
//@ts-ignore
router.post(
  "/upload-audio",
  //@ts-ignore
  authMiddleware(["TEACHER", "ADMIN"]),
  upload.fields([{ name: "file", maxCount: 1 }]),
  async (req: FileRequest, res: Response) => {
    try {
      const audioFile = req.files?.file?.[0];

      if (!audioFile) {
        return res.status(400).json({ message: "Audio file is required." });
      }

      // Upload to Cloudinary
      //@ts-ignore
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

// Add a route for uploading metadata
router.post(
  "/upload-metadata",
  //@ts-ignore
  authMiddleware(["TEACHER", "ADMIN"]),
  async (req: Request, res: Response) => {
    try {
      const { metadata } = req.body;

      if (!metadata) {
        return res.status(400).json({ message: "Metadata is required" });
      }

      // Convert metadata to string if it's an object
      const metadataString =
        typeof metadata === "object" ? JSON.stringify(metadata) : metadata;
      // Upload metadata to Cloudinary as a JSON file
      const metadataUpload = await uploadToCloudinary(
        metadataString,
        "raw",
        //@ts-ignore
        "metadata",
        "json"
      );

      return res.status(200).json({
        message: "Metadata uploaded successfully",
        metadataUrl: metadataUpload.secure_url,
      });
    } catch (error) {
      console.error("❌ Error uploading audio metadata:", error);
      return res
        .status(500)
        .json({ message: "Failed to upload audio metadata" });
    }
  }
);

// Make sure to add the FileRequest interface if it doesn't exist elsewhere
interface FileRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

// Export the router as default export
export default router;
