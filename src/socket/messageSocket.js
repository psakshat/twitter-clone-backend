// app/socket/messageSocket.js

import { Message, Conversation } from "../models/index.js";

// Accept socket as argument instead of registering connection event
export default function messageSocket(io, onlineUsers, socket) {
  // 1️⃣ Register User Connection
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`🟢 User ${userId} added to onlineUsers`);
    // Notify others this user is online
    socket.broadcast.emit("user-online", { userId });
  });

  // 2️⃣ Handle Sending Messages
  socket.on("send-msg", async (data) => {
    try {
      const { conversationId, sender, receiver, text, media } = data;
      const message = await Message.create({
        conversationId,
        sender,
        receiver,
        text,
        media,
      });
      const updatedConversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { lastMessage: message._id },
        { new: true }
      );
      if (!updatedConversation) {
        console.warn(`❗ Conversation not found for ID: ${conversationId}`);
      } else {
        console.log(
          `✅ lastMessage updated for conversation ${updatedConversation._id}`
        );
      }
      const receiverSocketId = onlineUsers.get(receiver);
      console.log(`📤 Sending to receiver socket: ${receiverSocketId}`);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("msg-receive", message);
      }
    } catch (err) {
      console.error("❌ send-msg error:", err);
      socket.emit("error", {
        type: "send-msg",
        message: "Failed to send message",
      });
    }
  });

  // 3️⃣ Typing Indicators
  socket.on("typing", ({ receiverId, senderId }) => {
    io.to(receiverId).emit("typing", { senderId });
  });

  socket.on("stop-typing", ({ receiverId, senderId }) => {
    io.to(receiverId).emit("stop-typing", { senderId });
  });

  // 4️⃣ Message Seen
  socket.on("message-seen", async ({ messageId, userId }) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { seen: true },
        { new: true }
      );
      if (!message) return;
      const senderSocketId = onlineUsers.get(message.sender.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("message-seen", {
          messageId,
          seenBy: userId,
          seenAt: new Date(),
        });
      }
    } catch (err) {
      console.error("❌ message-seen error:", err);
      socket.emit("error", {
        type: "message-seen",
        message: "Failed to update seen status.",
      });
    }
  });

  // 5️⃣ Mark All Messages in a Conversation as Seen
  socket.on("mark-all-seen", async ({ conversationId, userId }) => {
    try {
      const now = new Date();
      const unseenMessages = await Message.find({
        conversationId,
        receiver: userId,
        isDeleted: false,
        "seenBy.user": { $ne: userId },
      });
      if (unseenMessages.length === 0) return;
      const seenEntry = { user: userId, seenAt: now };
      await Promise.all(
        unseenMessages.map(async (msg) => {
          msg.seenBy.push(seenEntry);
          await msg.save();
          const senderSocketId = onlineUsers.get(msg.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit("message-seen", {
              messageId: msg._id,
              seenBy: userId,
              seenAt: now,
            });
          }
        })
      );
      console.log(
        `👀 Marked ${unseenMessages.length} messages as seen for user ${userId}`
      );
    } catch (err) {
      console.error("❌ mark-all-seen error:", err);
      socket.emit("error", {
        type: "mark-all-seen",
        message: "Failed to mark messages as seen.",
      });
    }
  });

  socket.on("add-reaction", ({ messageId, emoji, userId }) => {
    io.emit("reaction-updated", { messageId, emoji, userId });
  });

  socket.on("remove-reaction", ({ messageId, userId }) => {
    io.emit("reaction-removed", { messageId, userId });
  });

  // 6️⃣ Message Delivered (Acknowledgment)
  socket.on("message-delivered", ({ messageId, senderId }) => {
    const senderSocketId = onlineUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-delivered-update", { messageId });
    }
  });

  // 7️⃣ Disconnect
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 User ${userId} disconnected`);
        io.emit("user-offline", { userId });
        break;
      }
    }
  });

  // 🔒 Catch unhandled socket errors
  socket.on("error", (err) => {
    console.error("⚠️ Socket error:", err);
  });
}
