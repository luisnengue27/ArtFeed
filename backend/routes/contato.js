
const express = require("express");
const router = express.Router();

const { poolNeon } = require("../db");

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
        console.log("[CONTATO] Salvando mensagem no banco de dados");

        await poolNeon.query(
            `INSERT INTO mensagens_contato
                (nome, email, assunto, mensagem)
             VALUES
                ($1, $2, $3, $4)`,
            [nomeLimpo, emailLimpo, assuntoLimpo, mensagemLimpa]
        );

        console.log("[CONTATO] Mensagem salva no banco de dados");

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
