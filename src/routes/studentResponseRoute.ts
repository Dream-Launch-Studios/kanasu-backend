import express from "express";
import {
  createStudentResponse,
  getResponsesByStudent,
  getResponsesByEvaluation,
} from "../controllers/studentResponse";

const router = express.Router();

router.post("/", createStudentResponse);
router.get("/student/:studentId", getResponsesByStudent);
router.get("/evaluation/:evaluationId", getResponsesByEvaluation);

export default router;
