const winston = require("winston");
const fs = require("fs");
const path = require("path");

// Define your severity levels.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// This method sets the current severity based on
// the current NODE_ENV: show all the log levels
// if the server was run in development mode; otherwise,
// if it was run in production, show only warn and error messages.
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "blue",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
  winston.format.timestamp({ format: "DD MMM, YYYY - HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Define which transports the logger must use to print out messages.
const transports = [
  new winston.transports.File({
    filename: "src/logger/logs/error.log",
    level: "error",
  }),
  new winston.transports.File({ filename: "src/logger/logs/combined.log" }),
  new winston.transports.Console(),
];

// Create the logs folder if it doesn't exist
const logsFolder = path.join(__dirname, "logs");
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder);
}

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = { logger };
