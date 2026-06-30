const { Sequelize } = require("sequelize");

let sequelize;

const dialect =
  process.env.DB_DIALECT ||
  (process.env.DATABASE_URL ? "postgres" : "mysql");

const usarSSL = process.env.DB_SSL === "true";

const dialectOptions =
  dialect === "postgres" && usarSSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {};

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect,
    logging: false,
    dialectOptions,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || (dialect === "postgres" ? 5432 : 3306),
      dialect,
      logging: false,
      dialectOptions,
    }
  );
}

module.exports = sequelize;