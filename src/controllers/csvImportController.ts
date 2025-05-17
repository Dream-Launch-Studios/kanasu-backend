import type { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import prisma from "../config/prisma";
import { processStudentCsv } from "../utils/csvImport";

// Import students from CSV file
export const importStudentsFromCsv = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Extract anganwadiId if provided in form data
    const anganwadiId = req.body.anganwadiId || null;

    // Create import record
    const csvImport = await prisma.csvImport.create({
      data: {
        filename: req.file.originalname,
        importedBy: req.user?.id || "unknown", // Replace with actual user ID from auth
        status: "PENDING",
      },
    });

    // Process CSV file asynchronously
    const filePath = req.file.path;
    processStudentCsv(
      filePath, 
      csvImport.id, 
      req.user?.id || "unknown", 
      anganwadiId // Pass anganwadiId to processing function
    ).catch((error) => {
      console.error("Error processing CSV:", error);
    });

    return res.status(202).json({
      message: "CSV import started",
      importId: csvImport.id,
    });
  } catch (error) {
    // If there's an error, try to clean up the uploaded file
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Failed to delete file:", e);
      }
    }
    next(error);
  }
};

// Get CSV import status
export const getCsvImportStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { importId } = req.params;

    const csvImport = await prisma.csvImport.findUnique({
      where: { id: importId },
    });

    if (!csvImport) {
      return res.status(404).json({ error: "Import not found" });
    }

    return res.json(csvImport);
  } catch (error) {
    next(error);
  }
};

// Get all CSV imports (with pagination)
export const getAllCsvImports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [csvImports, totalCount] = await Promise.all([
      prisma.csvImport.findMany({
        skip,
        take: limit,
        orderBy: { importedAt: "desc" },
      }),
      prisma.csvImport.count(),
    ]);

    return res.json({
      data: csvImports,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}; 