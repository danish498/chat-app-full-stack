import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import routes from "./routes/index.js";
import attachWebSocketServer from "./socket/server.js";
import logger from "./utils/logger.js";

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(morgan("combined", { stream: logger.stream }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// WebSocket setup
const {
  getStats,
  broadcastNewMessage,
  broadcastNewGroupMessage,
  broadcastMessageUpdate,
  broadcastSystemEvent,
  broadcastToUser,
  broadcastToAll,
  EVENTS,
} = attachWebSocketServer(server);

app.locals.getStats = getStats;
app.locals.broadcastNewMessage = broadcastNewMessage;
app.locals.broadcastNewGroupMessage = broadcastNewGroupMessage;
app.locals.broadcastMessageUpdate = broadcastMessageUpdate;
app.locals.broadcastSystemEvent = broadcastSystemEvent;
app.locals.broadcastToUser = broadcastToUser;
app.locals.broadcastToAll = broadcastToAll;
app.locals.EVENTS = EVENTS;

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

export {
  app,
  server,
  getStats,
  broadcastNewMessage,
  broadcastNewGroupMessage,
  broadcastToAll,
};
