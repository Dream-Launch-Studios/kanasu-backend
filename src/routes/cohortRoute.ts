import express from "express";
import { createCohort, deleteCohort, getCohorts} from "../controllers/cohortController";

const router = express.Router();

//@ts-ignore
router.post("/", createCohort);
//@ts-ignore
router.get("/", getCohorts);
//@ts-ignore
router.delete("/:id", deleteCohort);

export default router;
