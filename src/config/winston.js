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
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error'
    }),
    // Write HTTP requests to a separate file
    new winston.transports.DailyRotateFile({
      filename: 'logs/requests-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'http'
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

// Make sure to export the logger instance
module.exports = logger;