import { Message, Conversation } from "../models/index.js";

export default function messageSocket(io, onlineUsers, socket) {
  socket.on("send-msg", async (data) => {
    try {
      const { conversationId, sender, receiver, text, media } = data;
      console.log("Message data received:", data);

      if (!conversationId || !sender || !receiver || (!text && !media)) {
        socket.emit("msg-error", { error: "Missing required fields" });
        return;
      }

      const message = await Message.create({
        conversationId,
        sender,
        receiver,
        text,
        media,
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
      });

      const populatedMessage = await Message.findById(message._id).populate(
        "sender",
        "username profilePicture"
      );

      console.log("Message created:", populatedMessage);

      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("msg-receive", populatedMessage);
        console.log(
          `Emitted msg-receive to receiver ${receiver} (socket ${receiverSocketId})`
        );
      }

      socket.emit("msg-sent", populatedMessage);
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("msg-error", { error: "Failed to send message" });
    }
  });

  socket.on("mark-seen", async (data) => {
    try {
      const { messageId, userId } = data;
      await Message.findByIdAndUpdate(messageId, {
        seen: true,
        $addToSet: {
          seenBy: {
            user: userId,
            seenAt: new Date(),
          },
        },
      });

      const message = await Message.findById(messageId);
      const otherUserSocketId = onlineUsers.get(message.sender.toString());
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("msg-seen", { messageId, userId });
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
}
