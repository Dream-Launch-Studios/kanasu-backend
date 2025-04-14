import express from "express";
import {
  createGlobalAssessment,
  getGlobalAssessments,
  getGlobalAssessmentById,
  getAnganwadiSubmissions,
  recordStudentSubmission,
  publishGlobalAssessment,
  completeGlobalAssessment,
  getActiveAssessmentsForAnganwadi,
  getSubmissionById,
  submitBulkResponses,
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

// Get a specific submission
router.get("/:assessmentId/submissions/:submissionId", getSubmissionById);

// Record a student submission
router.post("/:assessmentId/student/:studentId", recordStudentSubmission);

// Publish a global assessment
router.patch("/:id/publish", publishGlobalAssessment);

// Complete a global assessment
router.patch("/:id/complete", completeGlobalAssessment);

// Submit bulk responses
router.post("/bulk", submitBulkResponses);

export default router;
