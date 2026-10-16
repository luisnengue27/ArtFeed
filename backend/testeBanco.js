const { poolNeon } = require("./db");

async function testarBanco() {
    try {
        const resultado = await poolNeon.query(`
            SELECT * FROM artistas
        `);

        console.log("✅ Dados encontrados no banco:");
        console.log(resultado.rows);

    } catch (erro) {
        console.error("❌ Erro ao consultar o banco:", erro);
    }
}

testarBanco();