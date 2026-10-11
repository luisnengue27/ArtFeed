require("dotenv").config({
    path: require("path").join(__dirname, ".env"),
});

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

transporter.verify()
    .then(() => {
        console.log("Autenticação SMTP realizada com sucesso!");
    })
    .catch((erro) => {
        console.error("Falha na autenticação:", erro.message);
    });