const express = require("express");
const router = express.Router();

const { poolPromise } = require("../db");

router.get("/artistas", async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultado = await pool.request().query(`
            SELECT
                id,
                username,
                email,
                data_cadastro
            FROM Artistas
        `);

        res.json(resultado.recordset);

    } catch (erro) {
        console.error("❌ Erro ao buscar artistas:", erro);
        res.status(500).json({
            erro: "Erro ao buscar artistas no banco de dados."
        });
    }
});

module.exports = router;