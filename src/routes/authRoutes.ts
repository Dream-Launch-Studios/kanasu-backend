import express from "express";
import { register, login } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

//@ts-ignore
router.post("/register", register);
//@ts-ignore
router.post("/login", login);
//@ts-ignore
router.get("/dashboard", authMiddleware(["ADMIN", "REGIONAL_COORDINATOR"]), (req, res) => {
  res.json({ message: "Welcome to the Dashboard", user: req.user });
});

export default router;
