import type { Request, Response } from "express";
import prisma from "../config/prisma";

// ✅ Create a Topic
export const createTopic = async (req: Request, res: Response) => {
  try {
    const { name, version } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Topic name is required." });
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        version: version ? parseInt(version) : 1,
      },
    });

    return res.status(201).json({
      message: "Topic created successfully",
      topic,
    });
  } catch (error) {
    console.error("❌ Error creating topic:", error);
    return res.status(500).json({ message: "Failed to create topic" });
  }
};

// ✅ Get All Topics
export const getAllTopics = async (_req: Request, res: Response) => {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        questions: true,
        evaluations: true,
      },
    });

    return res.json(topics);
  } catch (error) {
    console.error("❌ Error fetching topics:", error);
    return res.status(500).json({ message: "Failed to fetch topics" });
  }
};

// ✅ Get Topic by ID
export const getTopicById = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        questions: true,
        evaluations: true,
      },
    });

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    return res.json(topic);
  } catch (error) {
    console.error("❌ Error fetching topic:", error);
    return res.status(500).json({ message: "Failed to fetch topic" });
  }
};

// ✅ Update Topic
export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { name, version } = req.body;

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: {
        name,
        version: version ? parseInt(version) : undefined,
      },
    });

    return res.json({
      message: "Topic updated successfully",
      topic: updated,
    });
  } catch (error) {
    console.error("❌ Error updating topic:", error);
    return res.status(500).json({ message: "Failed to update topic" });
  }
};

// ✅ Delete Topic
export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    await prisma.topic.delete({
      where: { id: topicId },
    });

    return res.json({ message: "Topic deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting topic:", error);
    return res.status(500).json({ message: "Failed to delete topic" });
  }
};
