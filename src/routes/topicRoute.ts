import express from "express";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
} from "../controllers/topicController";

const router = express.Router();

// ✅ Create a new topic
router.post("/", createTopic);

// ✅ Get all topics
router.get("/", getAllTopics);

// ✅ Get topic by ID
router.get("/:topicId", getTopicById);

// ✅ Update topic by ID
router.put("/:topicId", updateTopic);

// ✅ Delete topic by ID
router.delete("/:topicId", deleteTopic);

export default router;
