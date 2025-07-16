import messageSocket from "./messageSocket.js";

export default function setupSocketIO(io) {
  const onlineUsers = new Map();
  const socketToUser = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
      socketToUser.set(socket.id, userId);
      socket.join(userId);
      console.log(`User ${userId} added to onlineUsers`);
      socket.broadcast.emit("user-online", userId);
      socket.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("get-online-users", () => {
      socket.emit("online-users", Array.from(onlineUsers.keys()));
    });

    messageSocket(io, onlineUsers, socket);

    socket.on("disconnect", () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        onlineUsers.delete(userId);
        socketToUser.delete(socket.id);
        socket.broadcast.emit("user-offline", userId);
        console.log(`User ${userId} disconnected`);
      }
      console.log("Socket disconnected:", socket.id);
    });

    socket.on("logout", () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        onlineUsers.delete(userId);
        socketToUser.delete(socket.id);
        socket.broadcast.emit("user-offline", userId);
      }
      socket.disconnect();
    });
  });
}
