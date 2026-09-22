const { sql, poolPromise } = require("./db");

async function testarBanco() {
    try {
        const pool = await poolPromise;

        const resultado = await pool.request().query(`
            SELECT * FROM Artistas
        `);

        console.log("✅ Dados encontrados no banco:");
        console.log(resultado.recordset);

    } catch (erro) {
        console.error("❌ Erro ao consultar o banco:", erro);
    }
}

testarBanco();