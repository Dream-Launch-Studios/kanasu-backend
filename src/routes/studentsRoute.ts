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
  getStudentsForAssessment,
  updateStudent,
} from "../controllers/studentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { handleCsvUpload } from "../middlewares/uploadMiddleware";
import { importStudentsFromCsv } from "../controllers/csvImportController";

const router = express.Router();

//@ts-ignore
router.post("/", createStudent);
//@ts-ignore
router.get("/", getStudents);
//@ts-ignore
router.delete("/:id", deleteStudent);
//@ts-ignore
router.patch("/assign-anganwadi", addStudentToAnganwadi);
//@ts-ignore
router.get("/anganwadi/:anganwadiId", addStudentToAnganwadi);
//@ts-ignore
router.post("/assign-by-name", searchAndAddStudentToAnganwadiByName);
//@ts-ignore
router.get("/search", searchStudents);

// New CSV import route
//@ts-ignore
router.post("/import-csv", handleCsvUpload, importStudentsFromCsv);

// New assessment-related routes
//@ts-ignore
router.get("/for-assessment", getStudentsForAssessment);
//@ts-ignore
router.get("/:studentId/evaluations", getStudentEvaluations);
//@ts-ignore
router.get("/:studentId/performance", getStudentPerformanceSummary);

//@ts-ignore
router.patch("/:id", updateStudent);

export default router;
