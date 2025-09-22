const winston = require('winston');
const { combine, timestamp, printf, colorize, errors } = winston.format;
require('winston-daily-rotate-file');

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'shopping-cart-api' },
  transports: [
    // Write ONLY 'info' level logs to combined.log
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info' // This captures info AND higher levels
    }),
    
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error' // This captures only errors
    }),
    
    // Write HTTP requests to a separate file
    new winston.transports.DailyRotateFile({
      filename: 'logs/requests-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'http' // This captures only http level
    }),
    
    // Add a separate transport for debug logs if needed
    new winston.transports.DailyRotateFile({
      filename: 'logs/debug-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      level: 'debug' // This captures debug and higher
    })
  ]
});

// If we're not in production, log to the console too
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    )
  }));
}

// Create a stream for Morgan to use Winston for HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;