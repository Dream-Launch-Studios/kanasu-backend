import express from "express";
import {
  createGlobalAssessment,
  getGlobalAssessments,
  getGlobalAssessmentById,
  getAnganwadiSubmissions,
  recordStudentSubmission,
  publishGlobalAssessment,
  completeGlobalAssessment,
  getActiveAssessmentsForAnganwadi
} from "../controllers/globalAssessmentController";

const router = express.Router();

// Create a new global assessment
router.post("/", createGlobalAssessment);

// Get all global assessments
router.get("/", getGlobalAssessments);

// Get active assessments for an anganwadi
router.get("/active", getActiveAssessmentsForAnganwadi);

// Get a specific global assessment
router.get("/:id", getGlobalAssessmentById);

// Get submissions for a specific anganwadi
router.get("/:assessmentId/anganwadi/:anganwadiId", getAnganwadiSubmissions);

// Record a student submission
router.post("/:assessmentId/student/:studentId", recordStudentSubmission);

// Publish a global assessment
router.patch("/:id/publish", publishGlobalAssessment);

// Complete a global assessment
router.patch("/:id/complete", completeGlobalAssessment);

export default router; 