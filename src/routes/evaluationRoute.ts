import { Router } from "express";
import multer from "multer";
import { createEvaluation, getEvaluations, getEvaluationById } from "../controllers/evaluationController";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "metadata", maxCount: 1 },
  ]),
  createEvaluation
);

router.get("/", getEvaluations);
router.get("/:id", getEvaluationById);

export default router;
