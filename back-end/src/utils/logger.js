import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for development
const devLogFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Production format (JSON)
const prodLogFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

const logDir = config.logger.folder || 'logs';

// Transportation for different environments
const transports = [];

// Daily rotate file for production (and maybe error logs in development)
if (config.nodeEnv === 'production') {
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new winston.transports.DailyRotateFile({
      level: config.logger.level, // info by default
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
} else {
  // Developer friendly logging
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        devLogFormat
      ),
    })
  );
}

const logger = winston.createLogger({
  level: config.logger.level,
  format: config.nodeEnv === 'production' ? prodLogFormat : undefined,
  transports,
  exitOnError: false,
});

// Create a stream object with a 'write' function that will be used by Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;
