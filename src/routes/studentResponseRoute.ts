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
  countResponsesByAnganwadi,
} from "../controllers/studentResponse";

const router = express.Router();

//@ts-ignore
router.post("/", createStudentResponse);
//@ts-ignore
router.post("/batch", batchCreateStudentResponses);
//@ts-ignore
router.post("/submit-exam", submitTeacherBatchResponses);
//@ts-ignore
router.post("/audio-assessment", submitAudioResponses);
//@ts-ignore
router.post("/transcription", processTextTranscription);
//@ts-ignore
router.get("/student/:studentId", getResponsesByStudent);
//@ts-ignore
router.get("/evaluation/:evaluationId", getResponsesByEvaluation);
//@ts-ignore
router.get("/scored", getScoredResponses);
//@ts-ignore
router.get("/export", exportResponses);
//@ts-ignore
router.get("/download-all", downloadAllResponses);
router.get("/anganwadi/:anganwadiId/count", countResponsesByAnganwadi);
router.get("/:id", getResponseById);
//@ts-ignore
router.post("/:responseId/score", scoreStudentResponse);
//@ts-ignore
router.post("/batch-score", batchScoreResponses);
//@ts-ignore
router.post("/upload-audio", uploadAudioFromMobile);
//@ts-ignore
router.post("/upload-metadata", uploadAudioMetadata);

export default router;
