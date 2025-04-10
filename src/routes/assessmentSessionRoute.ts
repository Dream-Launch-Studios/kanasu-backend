import express from "express";
import {
  createAssessmentSession,
  getAssessmentSessions,
  getAssessmentSessionById,
  getActiveAssessmentSessions,
  updateAssessmentSession,
  deleteAssessmentSession,
} from "../controllers/assessmentSessionController";

const router = express.Router();

// Create a new assessment session
router.post("/", createAssessmentSession);

// Get all assessment sessions
router.get("/", getAssessmentSessions);

// Get active assessment sessions
router.get("/active", getActiveAssessmentSessions);

// Get assessment session by ID
router.get("/:id", getAssessmentSessionById);

// Update assessment session
router.put("/:id", updateAssessmentSession);

// Delete assessment session
router.delete("/:id", deleteAssessmentSession);

export default router;
