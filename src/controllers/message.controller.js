// controllers/message.controller.js
import { Message, Conversation } from "../models/index.js";

// Get all messages in a conversation
export const getMessages = async (req, res) => {
  try {
    // Fetch messages for the conversation with proper aggregation to avoid duplicates
    const messages = await Message.aggregate([
      {
        $match: {
          conversationId: req.params.conversationId,
        },
      },
      {
        $group: {
          _id: "$_id",
          conversationId: { $first: "$conversationId" },
          sender: { $first: "$sender" },
          receiver: { $first: "$receiver" },
          text: { $first: "$text" },
          media: { $first: "$media" },
          seen: { $first: "$seen" },
          seenBy: { $first: "$seenBy" },
          isDeleted: { $first: "$isDeleted" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          as: "sender",
          pipeline: [
            {
              $project: {
                username: 1,
                profilePicture: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$sender",
      },
    ]);

    // Format messages to include date and time
    const formatted = messages.map((msg) => {
      return {
        ...msg,
        date: msg.createdAt
          ? new Date(msg.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : null,
        time: msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : null,
      };
    });

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

    // Check if message already exists (prevent duplicates)
    const existingMessage = await Message.findOne({
      conversationId,
      sender,
      receiver,
      text,
      createdAt: { $gte: new Date(Date.now() - 5000) }, // Within last 5 seconds
    });

    if (existingMessage) {
      return res.status(200).json(existingMessage);
    }

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

    // Populate sender info
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username profilePicture"
    );

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Error sending message:", err);
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
    console.error("Error fetching conversations:", err);
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
    console.error("Error creating conversation:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};
