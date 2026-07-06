import { app, allowedOrigin } from "./app.js";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerAiSocketHandlers } from "./src/sockets/ai.socket.js";
import { registerFolderSocketHandlers } from "./src/sockets/folder.socket.js";
import jwt from "jsonwebtoken";

const port = process.env.DEVELOPMENT_PORT || "5000";
const databaseUrl = process.env.DATABASE_URL;

let server;
let io;

const connectDatabase = async () => {
  try {
    if (!databaseUrl) throw new Error("DATABASE_URL is missing in environment variables");
    await mongoose.connect(databaseUrl, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      maxPoolSize: 10,
    });
    console.log("✅ Database connected");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

mongoose.connection.on("connected",    () => console.log("🔗 MongoDB connected"));
mongoose.connection.on("disconnected", () => console.log("🔌 MongoDB disconnected"));
mongoose.connection.on("reconnected",  () => console.log("🔁 MongoDB reconnected"));
mongoose.connection.on("error",  (err) => console.error("🚨 MongoDB error:", err.message));

const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close(true);
    if (server) {
      server.close(() => {
        console.log("Server closed cleanly");
        process.exit(0);
      });
      return;
    }
    process.exit(0);
  } catch (err) {
    console.error("Shutdown error:", err);
   
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT",  gracefulShutdown);

const startServer = async () => {
  const ok = await connectDatabase();
  if (!ok) process.exit(1);

  server = createServer(app);

  io = new Server(server, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    // 50MB buffer — required for folder uploads sent as one socket event
    maxHttpBufferSize: 50 * 1024 * 1024,
  });

  // ── JWT auth middleware — runs once per socket connection ──────────────────
  // After this, ALL communication is socket-only.
  // HTTP is only used for /auth routes.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log("❌ Socket rejected: no token");
      return next(new Error("Authentication failed: no token provided"));
    }
    try {
      const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESSTOCKEN_SECRET;
      const decoded = jwt.verify(token, secret, { issuer: "Ekalvya", audience: "User" });
      socket.user = { userId: decoded.userId };
      console.log(`🔒 Socket authed: ${socket.user.userId}`);
      next();
    } catch (err) {
      console.log("❌ Socket token invalid:", err.message);
      return next(new Error("Authentication failed: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🚀 Socket connected: ${socket.id} (user: ${socket.user?.userId})`);

    // Chat + AI agent (VoiceBox, LogicBox, FolderAgent)
    registerAiSocketHandlers(io, socket);

    // Folder upload, CRUD, file read/write/delete
    registerFolderSocketHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  server.listen(port, () => {
    console.log(`\n🟢 Server running on port ${port}`);
    console.log(`   HTTP  → /auth, /ai`);
    console.log(`   WS    → folder ops, AI agent, chat`);
  });

  return server;
};

await startServer();

export { app };