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

//@ts-ignore
router.post("/", createAnganwadi);
//@ts-ignore
router.get("/", getAnganwadis);
//@ts-ignore
router.get("/:id", getAnganwadiById);
//@ts-ignore
router.patch("/:id", updateAnganwadi);
//@ts-ignore
router.delete("/:id", deleteAnganwadi);
//@ts-ignore
router.post("/assign", assignToAnganwadi);

export default router;
