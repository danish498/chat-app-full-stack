const http = require("http");
const app = require("./server");
const colors = require("colors");
const { initializeSocket } = require("./socket");

// Create HTTP server
const server = http.createServer(app);

// Initialize socket
const io = initializeSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(colors.cyan(`Server is running on port ${PORT}`));
});
