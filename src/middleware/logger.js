const morgan = require('morgan');
const logger = require("../config/winston");

// Custom token for request body (for non-GET requests)
morgan.token('body', (req) => {
  if (req.method !== 'GET') {
    return JSON.stringify(req.body);
  }
  return '';
});

// Custom token for user ID if authenticated
morgan.token('user', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Define Morgan format
const morganFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :body';

// Morgan middleware for HTTP request logging
const httpLogger = morgan(morganFormat, {
  stream: logger.stream,
  skip: (req) => {
    // Skip health check requests to reduce log noise
    return req.url === '/api/health';
  }
});

module.exports = { httpLogger, logger };