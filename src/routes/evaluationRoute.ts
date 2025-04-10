import express from "express";
import {
  createEvaluation,
  getEvaluations,
  getEvaluationById,
  submitEvaluation,
  gradeStudentResponse,
  completeEvaluationGrading,
  getEvaluationsByStatus,
  getEvaluationsByAnganwadi,
  getEvaluationsBySession
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

// Submit a completed evaluation
router.put("/:id/submit", submitEvaluation);

// Grade a student response
router.post("/response/:responseId/grade", gradeStudentResponse);

// Mark an evaluation as completely graded
router.put("/:id/complete-grading", completeEvaluationGrading);

// Get evaluations by status (DRAFT, SUBMITTED, etc)
router.get("/status/:status", getEvaluationsByStatus);

// Get evaluations by Anganwadi
router.get("/anganwadi/:anganwadiId", getEvaluationsByAnganwadi);

// Get evaluations by Assessment Session
router.get("/session/:sessionId", getEvaluationsBySession);

export default router;
