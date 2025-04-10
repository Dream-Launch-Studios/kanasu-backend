import type { Request, Response } from "express";
import prisma from "../config/prisma";

// Create a new assessment session
export const createAssessmentSession = async (req: Request, res: Response) => {
  try {
    const {
      name,
      startDate,
      endDate,
      isActive,
      topicIds // Array of topic IDs to include in this session
    } = req.body;

    // Validate required fields
    if (!name || !startDate || !endDate || !topicIds || !Array.isArray(topicIds)) {
      return res.status(400).json({ 
        error: "Name, start date, end date, and topic IDs are required" 
      });
    }

    // Create the assessment session
    const assessmentSession = await prisma.assessmentSession.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : true,
        topicIds
      }
    });

    res.status(201).json({ 
      message: "Assessment session created successfully", 
      assessmentSession 
    });
  } catch (error) {
    console.error("[Create Assessment Session Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all assessment sessions
export const getAssessmentSessions = async (_req: Request, res: Response) => {
  try {
    const assessmentSessions = await prisma.assessmentSession.findMany({
      include: {
        evaluations: {
          include: {
            teacher: true,
            topic: true
          }
        }
      }
    });

    res.status(200).json(assessmentSessions);
  } catch (error) {
    console.error("[Get Assessment Sessions Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get assessment session by ID
export const getAssessmentSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assessmentSession = await prisma.assessmentSession.findUnique({
      where: { id },
      include: {
        evaluations: {
          include: {
            teacher: true,
            student: true,
            topic: true
          }
        }
      }
    });

    if (!assessmentSession) {
      return res.status(404).json({ error: "Assessment session not found" });
    }

    res.status(200).json(assessmentSession);
  } catch (error) {
    console.error("[Get Assessment Session By ID Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get active assessment sessions
export const getActiveAssessmentSessions = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const activeSessions = await prisma.assessmentSession.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        evaluations: {
          include: {
            teacher: true,
            topic: true
          }
        }
      }
    });

    res.status(200).json(activeSessions);
  } catch (error) {
    console.error("[Get Active Assessment Sessions Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update an assessment session
export const updateAssessmentSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      startDate,
      endDate,
      isActive,
      topicIds
    } = req.body;

    // Create a properly typed update data object
    const updateData: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
      isActive?: boolean;
      topicIds?: string[];
    } = {};
    
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (topicIds !== undefined) updateData.topicIds = topicIds;

    const updatedSession = await prisma.assessmentSession.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({ 
      message: "Assessment session updated successfully", 
      assessmentSession: updatedSession 
    });
  } catch (error) {
    console.error("[Update Assessment Session Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete an assessment session
export const deleteAssessmentSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if there are any evaluations linked to this session
    const session = await prisma.assessmentSession.findUnique({
      where: { id },
      include: { evaluations: true }
    });

    if (!session) {
      return res.status(404).json({ error: "Assessment session not found" });
    }

    if (session.evaluations.length > 0) {
      return res.status(400).json({
        error: "Cannot delete session with linked evaluations. Please remove evaluations first."
      });
    }

    await prisma.assessmentSession.delete({
      where: { id }
    });

    res.status(200).json({ message: "Assessment session deleted successfully" });
  } catch (error) {
    console.error("[Delete Assessment Session Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 