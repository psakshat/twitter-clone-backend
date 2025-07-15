// import express from "express";
// import cors from "cors";

// import authRoutes from "./routes/auth.route.js";
// import userRoutes from "./routes/user.route.js";
// import postRoutes from "./routes/post.route.js";
// import commentRoutes from "./routes/comment.route.js";
// import notificationRoutes from "./routes/notification.route.js";

// import { ENV } from "./config/env.js";
// import { connectDB } from "./config/db.js";

// const app = express();

// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/comments", commentRoutes);
// app.use("/api/notifications", notificationRoutes);

// app.get("/", (req, res) => res.send("Hello from server"));

// // Error middleware
// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err);
//   res.status(500).json({ error: err.message || "Internal server error" });
// });

// const startServer = async () => {
//   try {
//     await connectDB();

//     if (ENV.NODE_ENV !== "production") {
//       app.listen(ENV.PORT, () =>
//         console.log("Server running on PORT:", ENV.PORT)
//       );
//     }
//   } catch (error) {
//     console.error("Failed to start server:", error.message);
//     process.exit(1);
//   }
// };

// startServer();

// export default app;
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";
import messageRoutes from "./routes/message.route.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import setupSocketIO from "./socket/index.js";

dotenv.config();

// 1️⃣ Create Express App
const app = express();

app.use(cors());
app.use(express.json());

// 2️⃣ Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.get("/", (req, res) => res.send("Hello from server"));

// 3️⃣ Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// 4️⃣ Create HTTP Server & Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // or set to your frontend domain
    methods: ["GET", "POST"],
  },
});

// 5️⃣ Initialize Socket Handlers
setupSocketIO(io, app);

// 6️⃣ Start Server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(ENV.PORT, () => {
      console.log(`🚀 Server with WebSocket listening on PORT ${ENV.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
