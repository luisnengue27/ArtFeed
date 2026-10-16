const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const { Pool } = require("pg");

const poolNeon = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true
    }
});

poolNeon.on("connect", () => {
    console.log("✅ Conectado ao Neon PostgreSQL!");
});

poolNeon.on("error", (err) => {
    console.error("❌ Erro no pool do Neon PostgreSQL:", err.message);
});

module.exports = {
    poolNeon
};