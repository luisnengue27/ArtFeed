
const express = require("express");
const router = express.Router();

const sql = require("mssql");
const { poolPromise } = require("../db");

router.post("/", async (req, res) => {
    console.log("[CONTATO] Requisição recebida");

    const { nome, email, assunto, mensagem } = req.body || {};

    const nomeLimpo = typeof nome === "string" ? nome.trim() : "";
    const emailLimpo = typeof email === "string" ? email.trim() : "";
    const assuntoLimpo = typeof assunto === "string" ? assunto.trim() : "";
    const mensagemLimpa =
        typeof mensagem === "string" ? mensagem.trim() : "";

    // Validar campos obrigatórios
    if (!nomeLimpo || !emailLimpo || !assuntoLimpo || !mensagemLimpa) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos do formulário."
        });
    }

    // Validar limites dos campos
    if (
        nomeLimpo.length > 100 ||
        emailLimpo.length > 254 ||
        assuntoLimpo.length > 150 ||
        mensagemLimpa.length > 10000
    ) {
        return res.status(400).json({
            mensagem: "Um ou mais campos ultrapassaram o limite permitido."
        });
    }

    // Validar formato básico do e-mail
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo);

    if (!emailValido) {
        return res.status(400).json({
            mensagem: "Informe um endereço de e-mail válido."
        });
    }

    try {
        console.log("[CONTATO] Salvando mensagem no Azure SQL");

        const pool = await poolPromise;

        await pool.request()
            .input("nome", sql.NVarChar(100), nomeLimpo)
            .input("email", sql.NVarChar(254), emailLimpo)
            .input("assunto", sql.NVarChar(150), assuntoLimpo)
            .input("mensagem", sql.NVarChar(sql.MAX), mensagemLimpa)
            .query(`
                INSERT INTO dbo.MensagensContato
                    (nome, email, assunto, mensagem)
                VALUES
                    (@nome, @email, @assunto, @mensagem)
            `);

        console.log("[CONTATO] Mensagem salva no Azure SQL");

        return res.status(201).json({
            mensagem: "Mensagem recebida com sucesso!"
        });

    } catch (erro) {
        console.error("[CONTATO] Falha ao salvar no banco:", erro);

        return res.status(500).json({
            mensagem: "Não foi possível registrar sua mensagem. Tente novamente."
        });
    }
});

module.exports = router;
