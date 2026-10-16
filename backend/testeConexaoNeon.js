const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const { poolNeon } = require("./db");

async function testarConexaoNeon() {
    let cliente;

    try {
        if (!process.env.DATABASE_URL) {
            console.error("❌ Erro: DATABASE_URL não encontrada no ambiente.");
            process.exit(1);
        }

        cliente = await poolNeon.connect();

        const resultado = await cliente.query("SELECT 1 AS resultado");

        if (resultado.rows.length > 0 && resultado.rows[0].resultado === 1) {
            console.log("✅ Conexão com Neon PostgreSQL funcionou!");
        } else {
            console.error("❌ Erro: resultado inesperado da consulta SELECT 1.");
            process.exit(1);
        }
    } catch (erro) {
        console.error("❌ Falha ao conectar ao Neon PostgreSQL:", erro.message);
        process.exit(1);
    } finally {
        if (cliente) {
            cliente.release();
        }
        await poolNeon.end();
    }
}

testarConexaoNeon();
