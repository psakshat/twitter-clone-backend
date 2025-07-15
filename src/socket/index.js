// socket/index.js
import messageSocket from "./messageSocket.js";

export default function setupSocketIO(io) {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} added to onlineUsers`);
      console.log(
        "Current onlineUsers map:",
        Array.from(onlineUsers.entries())
      );
    });

    messageSocket(io, onlineUsers, socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
