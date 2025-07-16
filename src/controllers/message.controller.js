// controllers/message.controller.js
import { Message, Conversation } from "../models/index.js";

// Get all messages in a conversation
export const getMessages = async (req, res) => {
  try {
    // Fetch messages for the conversation
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .sort({ createdAt: 1 })
      .populate("sender", "username profilePicture");

    // Create a map to track unique messages by their _id
    const uniqueMessagesMap = new Map();

    // Filter out duplicates
    const uniqueMessages = messages.filter((msg) => {
      const msgKey = msg._id.toString();
      if (!uniqueMessagesMap.has(msgKey)) {
        uniqueMessagesMap.set(msgKey, true);
        return true;
      }
      return false;
    });

    // Format messages to include date and time
    const formatted = uniqueMessages.map((msg) => ({
      ...msg.toObject(),
      date: msg.createdAt
        ? msg.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null,
      time: msg.createdAt
        ? msg.createdAt.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Send message (optional if using Socket.IO only)
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, sender, receiver, text, media } = req.body;

    const message = await Message.create({
      conversationId,
      sender,
      receiver,
      text,
      media,
    });

    // Update last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.params.userId;

    const conversations = await Conversation.find({
      members: userId,
    })
      .sort({ updatedAt: -1 })
      .populate("members", "username profilePicture")
      .populate("lastMessage");

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// Create a new conversation
export const createConversation = async (req, res) => {
  try {
    const { members } = req.body;

    // Check if it already exists
    const existing = await Conversation.findOne({
      members: { $all: members, $size: members.length },
    });

    if (existing) return res.status(200).json(existing);

    const newConversation = await Conversation.create({ members });
    res.status(201).json(newConversation);
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
};
