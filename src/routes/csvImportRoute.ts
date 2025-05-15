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
//@ts-ignore
router.post("/students", authMiddleware(["ADMIN"]), handleCsvUpload, importStudentsFromCsv);

// Get import status
//@ts-ignore
router.get("/:importId", authMiddleware(["ADMIN"]), getCsvImportStatus);

// Get all imports with pagination
//@ts-ignore
router.get("/", authMiddleware(["ADMIN"]), getAllCsvImports);

export default router; 