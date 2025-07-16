import { Message, Conversation } from "../models/index.js";

export default function messageSocket(io, onlineUsers, socket) {
  const messageQueue = new Map(); // Track recent messages to prevent duplicates

  socket.on("send-msg", async (data) => {
    try {
      const { conversationId, sender, receiver, text, media } = data;
      console.log("Message data received:", data);

      if (!conversationId || !sender || !receiver || (!text && !media)) {
        socket.emit("msg-error", { error: "Missing required fields" });
        return;
      }

      // Create unique key for duplicate detection
      const messageKey = `${sender}-${receiver}-${text}-${Date.now()}`;
      const duplicateWindow = 5000; // 5 seconds

      // Check for recent duplicate
      const recentMessages = Array.from(messageQueue.entries())
        .filter(([key, timestamp]) => Date.now() - timestamp < duplicateWindow)
        .map(([key]) => key);

      const isDuplicate = recentMessages.some((key) =>
        key.includes(`${sender}-${receiver}-${text}`)
      );

      if (isDuplicate) {
        console.log("Duplicate message detected, ignoring");
        return;
      }

      // Add to queue
      messageQueue.set(messageKey, Date.now());

      // Clean old entries
      setTimeout(() => {
        messageQueue.delete(messageKey);
      }, duplicateWindow);

      // Check if similar message was created recently
      const existingMessage = await Message.findOne({
        conversationId,
        sender,
        receiver,
        text,
        createdAt: { $gte: new Date(Date.now() - 3000) }, // Within last 3 seconds
      });

      if (existingMessage) {
        console.log("Recent similar message found, returning existing");
        const populatedExisting = await Message.findById(
          existingMessage._id
        ).populate("sender", "username profilePicture");
        socket.emit("msg-sent", populatedExisting);
        return;
      }

      // Create new message
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
        updatedAt: new Date(),
      });

      const populatedMessage = await Message.findById(message._id).populate(
        "sender",
        "username profilePicture"
      );

      console.log("Message created:", populatedMessage);

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("msg-receive", populatedMessage);
        console.log(
          `Emitted msg-receive to receiver ${receiver} (socket ${receiverSocketId})`
        );
      }

      // Send confirmation to sender
      socket.emit("msg-sent", populatedMessage);
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("msg-error", { error: "Failed to send message" });
    }
  });

  socket.on("mark-seen", async (data) => {
    try {
      const { messageId, userId } = data;

      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
          seen: true,
          $addToSet: {
            seenBy: {
              user: userId,
              seenAt: new Date(),
            },
          },
        },
        { new: true }
      );

      if (updatedMessage) {
        const otherUserSocketId = onlineUsers.get(
          updatedMessage.sender.toString()
        );
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("msg-seen", { messageId, userId });
        }
      }
    } catch (err) {
      console.error("Error marking message as seen:", err);
    }
  });

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on("leave-conversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  socket.on("typing", (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit("user-typing", { userId });
  });

  socket.on("stop-typing", (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit("user-stop-typing", { userId });
  });

  // Clean up message queue periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of messageQueue.entries()) {
      if (now - timestamp > 10000) {
        // 10 seconds
        messageQueue.delete(key);
      }
    }
  }, 30000); // Every 30 seconds

  socket.on("disconnect", () => {
    clearInterval(cleanupInterval);
  });
}
