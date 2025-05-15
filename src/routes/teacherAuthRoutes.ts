import express from "express";
import { requestOTP, verifyOTP, getTeacherProfile, getAnganwadiDetails } from "../controllers/teacherAuthController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Public routes
//@ts-ignore
router.post("/request-otp", requestOTP);
//@ts-ignore
router.post("/verify-otp", verifyOTP);

// Protected routes
//@ts-ignore
router.get("/profile", authMiddleware(["TEACHER"]), getTeacherProfile);
//@ts-ignore
router.get("/anganwadi", authMiddleware(["TEACHER"]), getAnganwadiDetails);

export default router; 