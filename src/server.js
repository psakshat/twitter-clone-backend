// import express from "express";
// import cors from "cors";
// import { clerkMiddleware } from "@clerk/express";

// import userRoutes from "./routes/user.route.js";
// import postRoutes from "./routes/post.route.js";
// import commentRoutes from "./routes/comment.route.js";
// import notificationRoutes from "./routes/notification.route.js";

// import { ENV } from "./config/env.js";
// import { connectDB } from "./config/db.js";
// import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use(clerkMiddleware());
// app.use(arcjetMiddleware);

// app.get("/", (req, res) => res.send("Hello from server"));

// app.use("/api/users", userRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/comments", commentRoutes);
// app.use("/api/notifications", notificationRoutes);

// // error handling middleware
// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err);
//   res.status(500).json({ error: err.message || "Internal server error" });
// });

// const startServer = async () => {
//   try {
//     await connectDB();

//     // listen for local development
//     if (ENV.NODE_ENV !== "production") {
//       app.listen(ENV.PORT, () =>
//         console.log("Server is up and running on PORT:", ENV.PORT)
//       );
//     }
//   } catch (error) {
//     console.error("Failed to start server:", error.message);
//     process.exit(1);
//   }
// };

// startServer();

// // export for vercel
// export default app;
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

const app = express();

// CORS configuration - make sure it allows credentials
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());

// Clerk middleware MUST come before protected routes
app.use(clerkMiddleware());
app.use(arcjetMiddleware);

app.get("/", (req, res) => res.send("Hello from server"));

// Routes - the protectRoute middleware should be applied in individual route files
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDB();

    if (ENV.NODE_ENV !== "production") {
      app.listen(ENV.PORT, () =>
        console.log("Server is up and running on PORT:", ENV.PORT)
      );
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;
