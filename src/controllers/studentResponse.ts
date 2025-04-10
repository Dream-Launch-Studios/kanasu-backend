// controllers/studentResponseController.ts
import type { Request, Response } from "express";
import prisma from "../config/prisma";

// ✅ Create a student response
export const createStudentResponse = async (req: Request, res: Response) => {
  try {
    const {
      evaluationId,
      questionId,
      studentId,
      startTime,
      endTime,
      audioUrl,
    } = req.body;

    const response = await prisma.studentResponse.create({
      data: {
        evaluationId,
        questionId,
        studentId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        audioUrl,
      },
    });

    res.status(201).json({ message: "Response saved", response });
  } catch (error) {
    console.error("❌ Error creating student response:", error);
    res.status(500).json({ error: "Failed to save response" });
  }
};

// ✅ Get all student responses for a student
export const getResponsesByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const responses = await prisma.studentResponse.findMany({
      where: { studentId },
      include: {
        question: true,
        evaluation: true,
      },
    });

    res.json(responses);
  } catch (error) {
    console.error("❌ Error fetching responses:", error);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
};

// ✅ Get all student responses for an evaluation
export const getResponsesByEvaluation = async (req: Request, res: Response) => {
  try {
    const { evaluationId } = req.params;

    const responses = await prisma.studentResponse.findMany({
      where: { evaluationId },
      include: {
        question: true,
        student: true,
      },
    });

    res.json(responses);
  } catch (error) {
    console.error("❌ Error fetching responses:", error);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
};
