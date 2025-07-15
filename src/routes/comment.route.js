import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createComment,
  getComments,
  deleteComment,
  getReplies,
} from "../controllers/comment.controller.js";

const router = express.Router();

// Get all top-level comments + nested replies
router.get("/post/:postId", getComments);

// Get direct replies to a comment (optional use for pagination)
router.get("/replies/:commentId", getReplies);

// Create comment or reply
router.post("/post/:postId", protectRoute, createComment);

// Delete comment and all nested replies
router.delete("/:commentId", protectRoute, deleteComment);

export default router;
