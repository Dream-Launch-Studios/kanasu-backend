import express from "express";
import {
  createStudent,
  getStudents,
  deleteStudent,
  addStudentToAnganwadi,
  searchAndAddStudentToAnganwadiByName,
  searchStudents,
  getStudentEvaluations,
  getStudentPerformanceSummary,
  getStudentsForAssessment
} from "../controllers/studentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { handleCsvUpload } from "../middlewares/uploadMiddleware";
import { importStudentsFromCsv } from "../controllers/csvImportController";

const router = express.Router();

router.post("/", createStudent);
router.get("/", getStudents);
router.delete("/:id", deleteStudent);
router.patch("/assign-anganwadi", addStudentToAnganwadi);
router.get("/anganwadi/:anganwadiId", addStudentToAnganwadi);
router.post("/assign-by-name", searchAndAddStudentToAnganwadiByName);
router.get("/search", searchStudents);

// New CSV import route
router.post("/import-csv", handleCsvUpload, importStudentsFromCsv);

// New assessment-related routes
router.get("/for-assessment", getStudentsForAssessment);
router.get("/:studentId/evaluations", getStudentEvaluations);
router.get("/:studentId/performance", getStudentPerformanceSummary);

export default router;
