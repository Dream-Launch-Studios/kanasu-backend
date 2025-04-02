import express from "express";
import { getUserProfile } from "../controllers/uesrController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/me", authMiddleware, getUserProfile); // Protected route

export default router;
