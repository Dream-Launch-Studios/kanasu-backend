import express from "express";
import {
  createTeacher,
  getTeachers,
  deleteTeacher,
  searchTeachers,
  getTeacherById,
  updateTeacher,
  getTeacherRankings,
  getTeacherStudents,
  getTeacherAssessmentSessions,
  getTeacherEvaluationsByStatus,
  getTeacherStudentsForAssessment,
  getTeacherPerformanceSummary,
  getTeacherStudentResponses
} from "../controllers/teacherController";

const router = express.Router();

// ✅ Create a teacher
//@ts-ignore
router.post("/", createTeacher);

// ✅ Get all teachers
//@ts-ignore
router.get("/", getTeachers);

// ✅ Search teachers
//@ts-ignore
router.get("/search", searchTeachers); // must come before "/:id"

// ✅ Get teacher leaderboard (ranking based on evaluations)
//@ts-ignore
router.get("/rankings", getTeacherRankings);

// ✅ Get students evaluated by a specific teacher
//@ts-ignore
router.get("/:id/students", getTeacherStudents);

// New assessment-related routes
//@ts-ignore
router.get("/:id/assessment-sessions", getTeacherAssessmentSessions);
//@ts-ignore
router.get("/:id/evaluations", getTeacherEvaluationsByStatus);
//@ts-ignore
router.get("/:id/students-for-assessment", getTeacherStudentsForAssessment);
//@ts-ignore
router.get("/:id/performance", getTeacherPerformanceSummary);

// ✅ Get teacher by ID
//@ts-ignore
router.get("/:id", getTeacherById);

// ✅ Update teacher
//@ts-ignore
router.put("/:id", updateTeacher);

// ✅ Delete teacher
//@ts-ignore
router.delete("/:id", deleteTeacher);

// New route to get student responses for a specific teacher
//@ts-ignore
router.get("/:id/student-responses", getTeacherStudentResponses);

export default router;
