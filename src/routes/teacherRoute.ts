import express from "express";
import {
  createTeacher,
  getTeachers,
  deleteTeacher,
  searchTeachers,
  getTeacherById,
} from "../controllers/teacherController";

const router = express.Router();

// ✅ Create a teacher
router.post("/", createTeacher);

// ✅ Get all teachers
router.get("/", getTeachers);

// ✅ Search teachers
router.get("/search", searchTeachers); // must come before "/:id"

// ✅ Get teacher by Anganwadi ID

// ✅ Get teacher by ID
router.get("/:id", getTeacherById);

// ✅ Update teacher

// ✅ Delete teacher
router.delete("/:id", deleteTeacher);

export default router;
