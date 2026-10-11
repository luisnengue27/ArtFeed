
const express = require("express");


const router = express.Router();

const emailUsuario = process.env.EMAIL_USER;
const senhaApp = process.env.EMAIL_APP_PASSWORD;

const nodemailer = require("nodemailer");
router.post("/", async (req, res) => {
    console.log("[CONTATO] Requisição recebida");
    try {
        const { nome, email, assunto, mensagem } = req.body || {};

        if (!nome || !email || !assunto || !mensagem) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos.",
            });
        }

        if (
            typeof nome !== "string" ||
            typeof email !== "string" ||
            typeof assunto !== "string" ||
            typeof mensagem !== "string"
        ) {
            return res.status(400).json({
                mensagem: "Os dados enviados são inválidos.",
            });
        }

        const nomeLimpo = nome.trim();
        const emailLimpo = email.trim();
        const assuntoLimpo = assunto.trim();
        const mensagemLimpa = mensagem.trim();

        const assuntosPermitidos = [
            "Duvida",
            "Problema tecnico",
            "Sugestao",
            "Denuncia",
            "Outro",
        ];

        if (
            !nomeLimpo ||
            nomeLimpo.length > 100 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo) ||
            emailLimpo.length > 254 ||
            !assuntosPermitidos.includes(assuntoLimpo) ||
            !mensagemLimpa ||
            mensagemLimpa.length > 3000
        ) {
            return res.status(400).json({
                mensagem: "Verifique os dados preenchidos.",
            });
        }

console.log("[CONTATO] Iniciando envio pela API Resend");

const { data, error } = await resend.emails.send({
    from: "ArtFeed <onboarding@resend.dev>",
    to: ["artfeed.fieb@gmail.com"],
    replyTo: emailLimpo,
    subject: `[ArtFeed] ${assuntoLimpo}`,
    text: [
        "Nova mensagem recebida pelo Fale Conosco do ArtFeed.",
        "",
        `Nome: ${nomeLimpo}`,
        `E-mail para resposta: ${emailLimpo}`,
        `Assunto: ${assuntoLimpo}`,
        "",
        "Mensagem:",
        mensagemLimpa,
    ].join("\n"),
});

if (error) {
    console.error("[CONTATO] Erro da API Resend:", error);

    return res.status(502).json({
        mensagem: "O serviço de e-mail não conseguiu enviar sua mensagem.",
    });
}

console.log("[CONTATO] E-mail aceito pelo Resend:", data.id);

return res.status(200).json({
    mensagem: "Mensagem enviada com sucesso!",
});

console.log("[CONTATO] E-mail enviado com sucesso");
        return res.status(200).json({
            mensagem: "Mensagem enviada com sucesso!",
        });
    } catch (erro) {
    console.error("[CONTATO] Falha no envio:", {
        message: erro.message,
        code: erro.code,
        command: erro.command,
        responseCode: erro.responseCode,
    });

    return res.status(500).json({
        mensagem: "Não foi possível enviar a mensagem. Tente novamente mais tarde.",
    });
}
});

module.exports = router;
