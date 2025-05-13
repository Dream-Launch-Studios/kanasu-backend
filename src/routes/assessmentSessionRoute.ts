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
//@ts-ignore
router.post("/", createAssessmentSession);

// Get all assessment sessions
//@ts-ignore
router.get("/", getAssessmentSessions);

// Get active assessment sessions
//@ts-ignore
router.get("/active", getActiveAssessmentSessions);

// Get assessment session by ID
//@ts-ignore
router.get("/:id", getAssessmentSessionById);

// Update assessment session
//@ts-ignore
router.put("/:id", updateAssessmentSession);

// Delete assessment session
//@ts-ignore
router.delete("/:id", deleteAssessmentSession);

export default router;
