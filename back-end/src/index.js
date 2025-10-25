const http = require("http");
const app = require("./server");
const colors = require("colors");
const { initializeSocket } = require("./socket");
const { logger } = require("./logger/winston.logger");

// Create HTTP server
const server = http.createServer(app);

// Initialize socket
const io = initializeSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(colors.cyan(`Server is running on port ${PORT}`));
});
