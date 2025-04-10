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
} from "../controllers/studentResponse";

const router = express.Router();

router.post("/", createStudentResponse);
router.post("/batch", batchCreateStudentResponses);
router.post("/submit-exam", submitTeacherBatchResponses);
router.get("/student/:studentId", getResponsesByStudent);
router.get("/evaluation/:evaluationId", getResponsesByEvaluation);
router.get("/scored", getScoredResponses);
router.get("/export", exportResponses);
router.get("/:id", getResponseById);

export default router;
