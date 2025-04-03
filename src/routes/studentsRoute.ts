import express from "express";
import {
  createStudent,
  getStudents,
  deleteStudent,
} from "../controllers/studentController";

const router = express.Router();

router.post("/", createStudent);
router.get("/", getStudents);
router.delete("/:id", deleteStudent);

export default router;
