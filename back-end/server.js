import { app, server } from './src/app.js';
import { config } from './src/config/index.js';
import logger from './src/utils/logger.js';

const PORT = config.port;
const HOST = config.host;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  logger.info(`Server is running at ${baseUrl}`);
  logger.info(
    `WebSocket server is running at ${baseUrl.replace("http", "ws")}/ws`,
  );
});

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

server.on('error', (error) => {
  logger.error('Server error:', error);
});