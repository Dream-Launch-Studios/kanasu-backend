import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { uploadToCloudinary } from "../utils/cloudinary";
import fs from "fs";

interface FileRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

export const createQuestion = async (req: FileRequest, res: Response) => {
  try {
    const { topicId, text, answerOptions, correctAnswers } = req.body;
    const imageFile = req.files?.image?.[0];
    const audioFile = req.files?.audio?.[0];

    if (!imageFile || !audioFile) {
      return res
        .status(400)
        .json({ message: "Image and audio files are required." });
    }

    // Validate answer options and correct answers
    let validatedAnswerOptions: string[] = [];
    let validatedCorrectAnswers: number[] = [];

    if (answerOptions && Array.isArray(answerOptions)) {
      // Ensure we have at most 4 answer options
      validatedAnswerOptions = answerOptions.slice(0, 4);

      // Validate correctAnswers are within range
      if (correctAnswers && Array.isArray(correctAnswers)) {
        validatedCorrectAnswers = correctAnswers
          .map((answer) => parseInt(answer as any))
          .filter(
            (index) =>
              !isNaN(index) &&
              index >= 0 &&
              index < validatedAnswerOptions.length
          );
      }
    }

    // Upload to Cloudinary
    //@ts-ignore
    const imageUpload = await uploadToCloudinary(
      imageFile.path,
      "image" as any
    );
    //@ts-ignore
    const audioUpload = await uploadToCloudinary(audioFile.path, "audio");

    // Clean up local files
    fs.unlinkSync(imageFile.path);
    fs.unlinkSync(audioFile.path);

    const question = await prisma.question.create({
      data: {
        text,
        topicId,
        imageUrl: imageUpload.secure_url,
        audioUrl: audioUpload.secure_url,
        answerOptions: validatedAnswerOptions,
        correctAnswers: validatedCorrectAnswers,
      },
    });

    res.status(201).json({
      message: "Question created successfully",
      question,
    });
  } catch (error) {
    console.error("❌ Error creating question:", error);
    res.status(500).json({ message: "Failed to create question" });
  }
};

export const getQuestionsByTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    const questions = await prisma.question.findMany({
      where: { topicId },
    });

    res.status(200).json(questions);
  } catch (error) {
    console.error("❌ Error fetching questions:", error);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};

// Get questions for an assessment session
export const getQuestionsByAssessmentSession = async (
  req: Request,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    const isAdminRequest = req.headers["x-user-role"] === "ADMIN";

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ message: "Assessment session not found" });
    }

    const questions = await prisma.question.findMany({
      where: {
        topicId: {
          in: session.topicIds,
        },
      },
      include: {
        topic: true,
      },
      orderBy: {
        topic: {
          name: "asc",
        },
      },
    });

    // For non-admin requests, remove the sensitive data
    const sanitizedQuestions = isAdminRequest
      ? questions
      : questions.map((question) => {
          const { answerOptions, correctAnswers, ...questionData } = question;
          return questionData;
        });

    res.status(200).json(sanitizedQuestions);
  } catch (error) {
    console.error("❌ Error fetching questions for session:", error);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};

// Batch create questions (for admin efficiency)
export const batchCreateQuestions = async (req: FileRequest, res: Response) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Questions array is required" });
    }

    // Process each question
    const createdQuestions = [];

    for (const questionData of questions) {
      const {
        topicId,
        text,
        imageUrl,
        audioUrl,
        answerOptions,
        correctAnswers,
      } = questionData;

      // Validate answer options and correct answers
      let validatedAnswerOptions: string[] = [];
      let validatedCorrectAnswers: number[] = [];

      if (answerOptions && Array.isArray(answerOptions)) {
        validatedAnswerOptions = answerOptions.slice(0, 4);

        if (correctAnswers && Array.isArray(correctAnswers)) {
          validatedCorrectAnswers = correctAnswers
            .map((answer) => parseInt(answer as any))
            .filter(
              (index) =>
                !isNaN(index) &&
                index >= 0 &&
                index < validatedAnswerOptions.length
            );
        }
      }

      // Create the question
      const question = await prisma.question.create({
        data: {
          text,
          topicId,
          imageUrl: imageUrl || "",
          audioUrl: audioUrl || "",
          answerOptions: validatedAnswerOptions,
          correctAnswers: validatedCorrectAnswers,
        },
      });

      createdQuestions.push(question);
    }

    res.status(201).json({
      message: `${createdQuestions.length} questions created successfully`,
      questions: createdQuestions,
    });
  } catch (error) {
    console.error("❌ Error batch creating questions:", error);
    res.status(500).json({ message: "Failed to create questions" });
  }
};

// Get all questions with filter options
export const getAllQuestions = async (req: Request, res: Response) => {
  try {
    const { topic, search } = req.query;
    // Check if request is from admin (assuming some auth middleware adds this)
    const isAdminRequest = req.headers["x-user-role"] === "ADMIN";

    // Build where clause based on filters
    const whereClause: any = {};

    if (topic) {
      whereClause.topicId = topic as string;
    }

    if (search) {
      whereClause.text = {
        contains: search as string,
        mode: "insensitive",
      };
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        topic: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // For non-admin requests, remove the answer options
    const sanitizedQuestions = isAdminRequest
      ? questions
      : questions.map((question) => {
          // Create a new object without answerOptions and correctAnswers
          const { answerOptions, correctAnswers, ...questionData } = question;
          return questionData;
        });

    res.status(200).json(sanitizedQuestions);
  } catch (error) {
    console.error("❌ Error fetching questions:", error);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
};

// Get question details with evaluation stats
export const getQuestionWithStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        topic: true,
        responses: {
          include: {
            StudentResponseScore: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Calculate statistics
    const totalResponses = question.responses.length;
    let totalScored = 0;
    let totalScoreSum = 0;

    question.responses.forEach((response) => {
      if (
        response.StudentResponseScore &&
        response.StudentResponseScore.length > 0
      ) {
        totalScored++;
        // Use the most recent score if multiple exist
        const mostRecentScore = response.StudentResponseScore.reduce(
          (latest, current) => {
            return new Date(current.gradedAt) > new Date(latest.gradedAt)
              ? current
              : latest;
          },
          response.StudentResponseScore[0]
        );

        totalScoreSum += mostRecentScore.score;
      }
    });

    const averageScore = totalScored > 0 ? totalScoreSum / totalScored : 0;

    // Add stats to question object
    const questionWithStats = {
      ...question,
      stats: {
        totalResponses,
        gradedResponses: totalScored,
        averageScore,
        gradingPercentage:
          totalResponses > 0 ? (totalScored / totalResponses) * 100 : 0,
      },
    };

    res.status(200).json(questionWithStats);
  } catch (error) {
    console.error("❌ Error fetching question stats:", error);
    res.status(500).json({ message: "Failed to fetch question statistics" });
  }
};

// Get a single question by ID
export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        topic: true,
        responses: {
          include: {
            StudentResponseScore: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Calculate statistics if there are responses
    if (question.responses && question.responses.length > 0) {
      const totalResponses = question.responses.length;
      let totalScored = 0;
      let totalScoreSum = 0;

      question.responses.forEach((response) => {
        if (
          response.StudentResponseScore &&
          response.StudentResponseScore.length > 0
        ) {
          totalScored++;
          // Use the most recent score if multiple exist
          const mostRecentScore = response.StudentResponseScore.reduce(
            (latest, current) => {
              return new Date(current.gradedAt) > new Date(latest.gradedAt)
                ? current
                : latest;
            },
            response.StudentResponseScore[0]
          );

          totalScoreSum += mostRecentScore.score;
        }
      });

      const averageScore = totalScored > 0 ? totalScoreSum / totalScored : 0;

      // Add stats to question object
      const questionWithStats = {
        ...question,
        stats: {
          totalResponses,
          gradedResponses: totalScored,
          averageScore,
          gradingPercentage:
            totalResponses > 0 ? (totalScored / totalResponses) * 100 : 0,
        },
      };

      return res.status(200).json(questionWithStats);
    }

    // If no responses, return the question without stats
    return res.status(200).json({
      ...question,
      stats: {
        totalResponses: 0,
        gradedResponses: 0,
        averageScore: 0,
        gradingPercentage: 0,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching question by ID:", error);
    res.status(500).json({ message: "Failed to fetch question" });
  }
};
