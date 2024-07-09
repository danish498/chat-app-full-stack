const app = require("./server");
// const config = require('./config/config');
const colors = require("colors");


require("./cronJobs");
// eslint-disable-next-line import/order
const http = require("http");
// socket initialization
const server = http.createServer(app);
// eslint-disable-next-line import/order
// const io = require('socket.io')(server, { cors: { origin: '*' } });

// global.io = io;
// require('./config/rootSocket')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(colors.cyan(`Server is running on port ${PORT}`));
});
