// socket/messageSocket.js
import { Message, Conversation } from "../models/index.js";

export default function messageSocket(io, onlineUsers, socket) {
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

      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("msg-receive", message);
        console.log(
          `Emitted msg-receive to receiver ${receiver} (socket ${receiverSocketId})`,
          message
        );
      } else {
        console.log(
          `Receiver ${receiver} not online, message not delivered in real time.`
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });
}
