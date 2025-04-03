import express from "express";
import {
    createAnganwadi,
    getAnganwadis,
    getAnganwadiById,
    updateAnganwadi,
    deleteAnganwadi,
} from "../controllers/anganwadiController"

import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", createAnganwadi);
router.get("/", getAnganwadis);
router.delete("/:id", getAnganwadiById);
router.patch("/assign-anganwadi", updateAnganwadi);
router.get("/anganwadi/:anganwadiId", deleteAnganwadi);

export default router;
