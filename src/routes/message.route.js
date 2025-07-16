// routes/message.route.js
import express from "express";
import {
  getMessages,
  sendMessage,
  getConversations,
  createConversation,
} from "../controllers/message.controller.js";
import { validateMessageInput } from "../middleware/validateMessageInput.js"; // Import the function from the new file

const router = express.Router();

// 📨 Get messages for a conversation
router.get("/:conversationId", getMessages);

// 💬 Send a new message (optional, mostly handled by Socket.IO)
router.post("/", validateMessageInput, sendMessage);

// 📥 Get all conversations for a user
router.get("/user/:userId", getConversations);

// ➕ Create new conversation
router.post("/conversation", createConversation);

export default router;
