/**
 * app.js
 *
 * FolderRoutes intentionally removed — all folder/file operations
 * now happen over Socket.IO (folder.socket.js).
 * Only auth is HTTP-based.
 */

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import authRouter from "./src/routes/AuthRoutes.routes.js";
import aiRouter from "./src/routes/AiRoutes.routes.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.js";

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP routes — auth only + AI REST fallback
app.use("/auth", authRouter);
app.use("/ai", aiRouter);   // REST fallback for AI if needed; socket is primary

// Folder ops → handled by Socket.IO in folder.socket.js (no HTTP route)

app.use(notFoundHandler);
app.use(errorHandler);

export { app, allowedOrigin };