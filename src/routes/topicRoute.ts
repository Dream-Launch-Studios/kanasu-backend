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
//@ts-ignore
router.post("/", createTopic);

// ✅ Get all topics
//@ts-ignore
router.get("/", getAllTopics);

// ✅ Get topic by ID
//@ts-ignore
router.get("/:topicId", getTopicById);

// ✅ Update topic by ID
//@ts-ignore
router.put("/:topicId", updateTopic);

// ✅ Delete topic by ID
//@ts-ignore
router.delete("/:topicId", deleteTopic);

export default router;
