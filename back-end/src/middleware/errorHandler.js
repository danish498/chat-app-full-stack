import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err);
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Specific handling for Multer errors (e.g., file too large)
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size is too large. Images are capped at 5MB and videos at 20MB.';
    }
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
