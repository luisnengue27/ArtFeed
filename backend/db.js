const sql = require("mssql/msnodesqlv8");

const config = {
    server: "localhost",
    database: "ArtFeed",

    driver: "ODBC Driver 18 for SQL Server",

    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

const poolPromise = sql.connect(config)
    .then(pool => {
        console.log("✅ Conectado ao SQL Server!");
        return pool;
    })
    .catch(err => {
        console.error("❌ Erro ao conectar ao SQL Server:", err);
    });

module.exports = {
    sql,
    poolPromise
};