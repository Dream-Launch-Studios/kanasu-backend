import express from "express";
import {
    createAnganwadi,
    getAnganwadis,
    getAnganwadiById,
    updateAnganwadi,
    deleteAnganwadi,
    assignToAnganwadi,
} from "../controllers/anganwadiController"

import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", createAnganwadi);
router.get("/", getAnganwadis);
router.get("/:id", getAnganwadiById);
router.patch("/assign-anganwadi", updateAnganwadi);
router.delete("/:id", deleteAnganwadi);
router.post("/assign", assignToAnganwadi);

export default router;
