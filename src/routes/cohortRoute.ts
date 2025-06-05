import express from "express";
import {
  createCohort,
  deleteCohort,
  getCohorts,
  updateTeacherRankings,
  getTeacherRankings,
  getCohortTeacherRankings,
  getCohortAssessments,
} from "../controllers/cohortController";

const router = express.Router();

//@ts-ignore
router.post("/", createCohort);
//@ts-ignore
router.get("/", getCohorts);
//@ts-ignore
router.delete("/:id", deleteCohort);

// Teacher ranking routes
//@ts-ignore
router.post("/:cohortId/rankings", updateTeacherRankings);
//@ts-ignore
router.get("/:cohortId/rankings", getTeacherRankings);

/**
 * Get teacher rankings for a specific cohort and assessment
 * @route GET /:cohortId/teacher-rankings
 * @param {string} cohortId - The ID of the cohort
 * @query {string} assessmentId - The ID of the assessment to get rankings for
 */
//@ts-ignore
router.get("/:cohortId/teacher-rankings", getCohortTeacherRankings);

//@ts-ignore
router.get("/:cohortId/assessments", getCohortAssessments);

export default router;
