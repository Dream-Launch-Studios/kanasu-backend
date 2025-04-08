import express from 'express';
import { upload } from '../middlewares/multer';
import { createEvaluation } from '../controllers/evaluationController';

const router = express.Router();

router.post(
  '/evaluations',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'metadata', maxCount: 1 },
  ]),
  createEvaluation
);

export default router;
