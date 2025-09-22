const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const donenv = require("dotenv").config();
const port = process.env.PORT || 5000;
const app_url = process.env.APP_URL + ":" + port;
const logger = require("./src/config/winston");
const { httpLogger } = require("./src/middleware/logger");
const {
  sequelize,
  testConnection,
  syncDatabase,
} = require("./src/config/database");
const models = require("./src/models");
const errorHandler = require("./src/middleware/errorHandler");

// Import route files
const adminRoutes = require("./src/routes/admin.routes");
const categoryRoutes = require("./src/routes/category.routes");

const app = express();

// HTTP request logging
app.use(httpLogger);

// Security headers
app.use(helmet());

// Body parser
app.use(express.json());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:3000", "*"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send(`Welcome to Shopping Cart API. Base URL: ${app_url}`);
});

// Routes
app.use("/api/admins", adminRoutes);
app.use("/api/categories", categoryRoutes);

// Error handler middleware
app.use(errorHandler);

// Health check endpoint
app.get("/api/health", (req, res) => {
  logger.debug("Health check requested");
  res.status(200).json({
    success: true,
    message: "Server is running",
    baseUrl: app_url,
  });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  console.log(`Server running on port ${port}`);
});

// Database connection
testConnection();
syncDatabase();
