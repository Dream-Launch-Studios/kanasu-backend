import express from "express";
import {
  createEvaluation,
  getEvaluations,
  getEvaluationById,
} from "../controllers/evaluationController";
import { upload } from "../middlewares/multer"; // Ensure this multer middleware is set up for multipart/form-data

const router = express.Router();

// ✅ Create Evaluation (audio + metadata)
router.post(
  "/",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "metadata", maxCount: 1 },
  ]),
  createEvaluation
);

// ✅ Get all evaluations
router.get("/", getEvaluations);

// ✅ Get evaluation by ID
router.get("/:id", getEvaluationById);

export default router;
