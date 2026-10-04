const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const sql = require("mssql");

const config = {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    port: 1433,

    options: {
        encrypt: true,
        trustServerCertificate: false
    },

    connectionTimeout: 30000,
    requestTimeout: 30000
};

const poolPromise = sql.connect(config)
    .then(pool => {
        console.log("✅ Conectado ao Azure SQL!");
        return pool;
    })
    .catch(err => {
        console.error("❌ Erro ao conectar ao Azure SQL:", err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};