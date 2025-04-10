import express from "express";
import {
  createAssessmentSession,
  getAssessmentSessions,
  getAssessmentSessionById,
  getActiveAssessmentSessions,
  updateAssessmentSession,
  deleteAssessmentSession
} from "../controllers/assessmentSessionController";

const router = express.Router();

// ✅ Create a new assessment session
router.post("/assessment-sessions", createAssessmentSession);

// ✅ Get all assessment sessions
router.get("/assessment-sessions", getAssessmentSessions);

// ✅ Get active assessment sessions
router.get("/assessment-sessions/active", getActiveAssessmentSessions);

// ✅ Get assessment session by ID
router.get("/assessment-sessions/:id", getAssessmentSessionById);

// ✅ Update an assessment session
router.put("/assessment-sessions/:id", updateAssessmentSession);

// ✅ Delete an assessment session
router.delete("/assessment-sessions/:id", deleteAssessmentSession);

export default router; 