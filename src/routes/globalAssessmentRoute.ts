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
  downloadAssessmentData,
} from "../controllers/globalAssessmentController";

const router = express.Router();

// Create a new global assessment
//@ts-ignore
router.post("/", createGlobalAssessment);

// Get all global assessments
//@ts-ignore
router.get("/", getGlobalAssessments);

// Get active assessments for an anganwadi
//@ts-ignore
router.get("/active", getActiveAssessmentsForAnganwadi);

// Get a specific global assessment
//@ts-ignore
router.get("/:id", getGlobalAssessmentById);

// Get submissions for a specific anganwadi
//@ts-ignore
router.get("/:assessmentId/anganwadi/:anganwadiId", getAnganwadiSubmissions);

// Get a specific submission
//@ts-ignore
router.get("/:assessmentId/submissions/:submissionId", getSubmissionById);

// Record a student submission
//@ts-ignore
router.post("/:assessmentId/student/:studentId", recordStudentSubmission);

// Publish a global assessment
//@ts-ignore
router.patch("/:id/publish", publishGlobalAssessment);

// Complete a global assessment
//@ts-ignore
router.patch("/:id/complete", completeGlobalAssessment);

// Submit bulk responses
//@ts-ignore
router.post("/bulk", submitBulkResponses);

// Download assessment data for offline use
//@ts-ignore
router.get("/:id/download", downloadAssessmentData);

export default router;
