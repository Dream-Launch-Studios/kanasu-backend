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
router.post("/", createTeacher);

// ✅ Get all teachers
router.get("/", getTeachers);

// ✅ Search teachers
router.get("/search", searchTeachers); // must come before "/:id"

// ✅ Get teacher leaderboard (ranking based on evaluations)
router.get("/rankings", getTeacherRankings);

// ✅ Get students evaluated by a specific teacher
router.get("/:id/students", getTeacherStudents);

// New assessment-related routes
router.get("/:id/assessment-sessions", getTeacherAssessmentSessions);
router.get("/:id/evaluations", getTeacherEvaluationsByStatus);
router.get("/:id/students-for-assessment", getTeacherStudentsForAssessment);
router.get("/:id/performance", getTeacherPerformanceSummary);

// ✅ Get teacher by ID
router.get("/:id", getTeacherById);

// ✅ Update teacher
router.put("/:id", updateTeacher);

// ✅ Delete teacher
router.delete("/:id", deleteTeacher);

// New route to get student responses for a specific teacher
router.get("/:id/student-responses", getTeacherStudentResponses);

export default router;
