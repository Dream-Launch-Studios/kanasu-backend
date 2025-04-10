import express from "express";
import {
  importStudentsFromCsv,
  getCsvImportStatus,
  getAllCsvImports
} from "../controllers/csvImportController";
import { handleCsvUpload } from "../middlewares/uploadMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Import students from CSV
router.post("/students", authMiddleware(["ADMIN"]), handleCsvUpload, importStudentsFromCsv);

// Get import status
router.get("/:importId", authMiddleware(["ADMIN"]), getCsvImportStatus);

// Get all imports with pagination
router.get("/", authMiddleware(["ADMIN"]), getAllCsvImports);

export default router; 