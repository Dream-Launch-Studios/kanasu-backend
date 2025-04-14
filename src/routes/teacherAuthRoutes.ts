import express from "express";
import { requestOTP, verifyOTP, getTeacherProfile, getAnganwadiDetails } from "../controllers/teacherAuthController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);

// Protected routes
router.get("/profile", authMiddleware(["TEACHER"]), getTeacherProfile);
router.get("/anganwadi", authMiddleware(["TEACHER"]), getAnganwadiDetails);

export default router; 