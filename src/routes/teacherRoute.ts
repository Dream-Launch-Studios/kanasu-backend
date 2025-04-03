import express from "express";
import {
  createTeacher,
  getTeachers,
  deleteTeacher,
  addTeacherToCohort,
  assignTeacherToAnganwadi,
} from "../controllers/teacherController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", createTeacher);
router.get("/", getTeachers);
router.delete("/:id", deleteTeacher);
router.patch("/assign", addTeacherToCohort);
router.post("/assign-anganwadi", assignTeacherToAnganwadi);
router.get("/by-anganwadi", assignTeacherToAnganwadi);

export default router;
