import express from "express";
import { createCohort, deleteCohort, getCohorts,  } from "../controllers/cohortController";

const router = express.Router();

router.post("/", createCohort);
router.get("/", getCohorts);
router.delete("/:id", deleteCohort);

export default router;
