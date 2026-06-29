const { Pool } = require("pg");

const db = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres", // Padrão do PostgreSQL é 'postgres'
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "projeto_mayckon",
  port: process.env.DB_PORT || 5432,       // Porta padrão do PostgreSQL
  max: 10,                                  // Equivalente ao connectionLimit
  idleTimeoutMillis: 30000,                 // Tempo para fechar conexões inativas
  connectionTimeoutMillis: 2000,            // Tempo máximo para tentar conectar
});

module.exports = db;
