// 1. Import 'server' alongside app from your app.js file
import { app, server } from "./app.js"; 
import mongoose from "mongoose";
// 2. Import the Socket.IO Server engine
import {initSocket} from "./src/Service/ScoketService.js"

const port = process.env.DEVLOPMENT_PORT || "5000"; // Note: Python script must target this port!
const environment = process.env.BACKEND_ENV || "DEVELOPMENT";
const database_url = process.env.DATABASE_URL;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

initSocket(server);

const connectDatabase = async (retriesLeft = MAX_RETRIES) => {
  try {
    if (!database_url) {
      throw new Error("DATABASE_URL is missing in environment variables");
    }
    await mongoose.connect(database_url, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      maxPoolSize: 10,
    });
    console.log("✅ connected to Database");
    return true;
  } catch (error) {
    console.error("❌ failed to connect:", error.message);

    if (retriesLeft > 0) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s... (${retriesLeft} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDatabase(retriesLeft - 1);
    }

    console.error("❌ Exhausted all retries. Exiting.");
    return false;
  }
};

mongoose.connection.on("connected", () => {
  console.log("🔗 MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔁 MongoDB reconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("🚨 MongoDB error:", error.message);
});

const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close(true);
    console.log("Database connection closed");

    if (server) {
      server.close(() => {
        console.log("Server closed cleanly");
        process.exit(0);
      });
      return;
    }
    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

const startServer = async () => {
  const dbConnected = await connectDatabase();
  if (!dbConnected) {
    console.error("❌ Could not connect to database. Exiting.");
    process.exit(1);
  }

  // 5. CRUCIAL FIX: Change from app.listen to server.listen 
  server.listen(port, () => {
    console.log(`\n🟢 Server running on port ${port} [${environment}]`);
  });

  return server;
};

await startServer();

export { app };
