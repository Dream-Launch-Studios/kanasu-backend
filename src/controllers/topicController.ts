import type { Request, Response } from 'express';
import prisma from '../config/prisma';

// Create a new topic
export const createTopic = async (req: Request, res: Response) => {
  try {
    const { name, version } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Topic name is required.' });
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        version: version ? parseInt(version) : 1,
      },
    });

    res.status(201).json(topic);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ message: 'Failed to create topic' });
  }
};

// Get all topics
export const getAllTopics = async (_req: Request, res: Response) => {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        questions: true,
        evaluations: true,
      },
    });

    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Failed to fetch topics' });
  }
};

// Get a single topic by ID
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
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ message: 'Failed to fetch topic' });
  }
};

// Optional: update a topic
export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { name, version } = req.body;

    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        name,
        version: version ? parseInt(version) : undefined,
      },
    });

    res.json(updatedTopic);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ message: 'Failed to update topic' });
  }
};

// Optional: delete a topic
export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    await prisma.topic.delete({
      where: { id: topicId },
    });

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Failed to delete topic' });
  }
};
