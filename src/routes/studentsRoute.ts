import express from "express";
import {
  createStudent,
  getStudents,
  deleteStudent,
  addStudentToAnganwadi,
  searchAndAddStudentToAnganwadiByName,
  searchStudents,
} from "../controllers/studentController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", createStudent);
router.get("/", getStudents);
router.delete("/:id", deleteStudent);
router.patch("/assign-anganwadi", addStudentToAnganwadi);
router.get("/anganwadi/:anganwadiId", addStudentToAnganwadi);
router.post("/assign-by-name", searchAndAddStudentToAnganwadiByName);
router.get("/", searchStudents);

export default router;
