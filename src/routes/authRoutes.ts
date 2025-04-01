import express from "express";
import { register, login } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/dashboard", authMiddleware(["ADMIN", "REGIONAL_COORDINATOR"]), (req, res) => {
  res.json({ message: "Welcome to the Dashboard", user: req.user });
});

export default router;
