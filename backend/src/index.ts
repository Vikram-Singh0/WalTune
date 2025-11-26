// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import artistRoutes from "./routes/artist.routes.js";
import songRoutes from "./routes/song.routes.js";
import walrusRoutes from "./routes/walrus.routes.js";
import x402Routes from "./routes/x402.routes.js";
import playCreditsRoutes from "./routes/playCredits.routes.js";
import configRoutes from "./routes/config.routes.js";

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "error" : "info",
  },
});

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Register plugins
async function registerPlugins() {
  // CORS - Allow multiple origins
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : ["http://localhost:3000"];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
  });

  // Multipart for file uploads (MP3)
  await fastify.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size
      files: 1, // Max 1 file per upload
    },
  });
}

// Register routes
async function registerRoutes() {
  await fastify.register(artistRoutes, { prefix: "/api/artist" });
  await fastify.register(songRoutes, { prefix: "/api/song" });
  await fastify.register(walrusRoutes, { prefix: "/api/walrus" });
  await fastify.register(x402Routes, { prefix: "/x402" });
  await fastify.register(playCreditsRoutes, {
    prefix: "/api/play-credits",
  });
  await fastify.register(configRoutes, { prefix: "/api/config" });
}

// Health check
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await registerPlugins();
    await registerRoutes();

    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🎵 WalTune Backend running on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
