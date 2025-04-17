import express from "express";
import {
  createStudentResponse,
  getResponsesByStudent,
  getResponsesByEvaluation,
  batchCreateStudentResponses,
  getScoredResponses,
  getResponseById,
  submitTeacherBatchResponses,
  exportResponses,
  scoreStudentResponse,
  batchScoreResponses,
  submitAudioResponses,
  uploadAudioFromMobile,
  uploadAudioMetadata,
  downloadAllResponses,
  processTextTranscription,
} from "../controllers/studentResponse";

const router = express.Router();

router.post("/", createStudentResponse);
router.post("/batch", batchCreateStudentResponses);
router.post("/submit-exam", submitTeacherBatchResponses);
router.post("/audio-assessment", submitAudioResponses);
router.post("/transcription", processTextTranscription);
router.get("/student/:studentId", getResponsesByStudent);
router.get("/evaluation/:evaluationId", getResponsesByEvaluation);
router.get("/scored", getScoredResponses);
router.get("/export", exportResponses);
router.get("/download-all", downloadAllResponses);
router.get("/:id", getResponseById);
router.post("/:responseId/score", scoreStudentResponse);
router.post("/batch-score", batchScoreResponses);
router.post("/upload-audio", uploadAudioFromMobile);
router.post("/upload-metadata", uploadAudioMetadata);

export default router;
