// app/socket/index.js

import User from "../models/users.js";
import messageSocket from "./messageSocket.js";

export default function setupSocketIO(io, app) {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    socket.on("user-online", async (userId) => {
      if (!userId) return;
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActive: new Date(),
      });
      socket.userId = userId;
      socket.join(userId);
    });

    socket.on("disconnect", async () => {
      if (!socket.userId) return;
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastActive: new Date(),
      });
      console.log("⚡ User disconnected:", socket.userId);
    });

    // Pass socket to messageSocket for messaging events
    messageSocket(io, onlineUsers, socket);
  });

  app.set("onlineUsers", onlineUsers);
}
