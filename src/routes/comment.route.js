import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createComment,
  getComments,
  deleteComment,
  getReplies,
} from "../controllers/comment.controller.js";

const router = express.Router();

// Get top-level comments for a post
router.get("/post/:postId", getComments);

// Get replies to a specific comment
router.get("/replies/:commentId", getReplies);

// Create comment or reply (authenticated)
router.post("/post/:postId", protectRoute, createComment);

// Delete comment (authenticated)
router.delete("/:commentId", protectRoute, deleteComment);

export default router;
