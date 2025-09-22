const { Sequelize } = require("sequelize");
const dotenv = require("dotenv").config();
const logger = require("./winston");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_CONNECTION,
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
      timeout: 30000,
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info("MySQL connection has been established successfully.");
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

// Sync database
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      logger.info("Database synced successfully");
    } else {
      logger.info("Database sync skipped in production");
    }
  } catch (error) {
    logger.error("Database sync error:", error);
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
