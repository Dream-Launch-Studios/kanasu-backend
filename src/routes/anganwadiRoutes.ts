import express from "express";
import {
  createAnganwadi,
  getAnganwadis,
  getAnganwadiById,
  updateAnganwadi,
  deleteAnganwadi,
  assignToAnganwadi,
} from "../controllers/anganwadiController";

import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Optionally add authMiddleware if routes require authentication
// e.g., router.post("/", authMiddleware, createAnganwadi);

router.post("/", createAnganwadi);
router.get("/", getAnganwadis);
router.get("/:id", getAnganwadiById);
router.patch("/:id", updateAnganwadi);
router.delete("/:id", deleteAnganwadi);
router.post("/assign", assignToAnganwadi);

export default router;
