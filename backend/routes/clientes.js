const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verificarToken = require("../middleware/authMiddleware");

const router = express.Router();

// Temporário, até conectarmos ao SQL Server
const clientes = [];

// ============================
// CADASTRO
// ============================

router.post("/cadastro", async (req, res) => {
    try {
        const { username, email, senha } = req.body;

        if (!username || !email || !senha) {
            return res.status(400).json({
                erro: "Todos os campos são obrigatórios."
            });
        }

        const clienteExistente = clientes.find(
            cliente => cliente.email === email
        );

        if (clienteExistente) {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        const senhaCriptografada = await bcrypt.hash(
            senha,
            10
        );

        const novoCliente = {
            id: clientes.length + 1,
            username,
            email,
            senha: senhaCriptografada,
            tipo: "cliente"
        };

        clientes.push(novoCliente);

        return res.status(201).json({
            mensagem: "Cliente cadastrado com sucesso!",
            cliente: {
                id: novoCliente.id,
                username: novoCliente.username,
                email: novoCliente.email,
                tipo: novoCliente.tipo
            }
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

// ============================
// LOGIN
// ============================

router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                erro: "E-mail e senha são obrigatórios."
            });
        }

        const cliente = clientes.find(
            cliente => cliente.email === email
        );

        if (!cliente) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            cliente.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const token = jwt.sign(
            {
                id: cliente.id,
                tipo: cliente.tipo
            },
            "chave-secreta-artfeed",
            {
                expiresIn: "2h"
            }
        );

        return res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token,

            cliente: {
                id: cliente.id,
                username: cliente.username,
                email: cliente.email,
                tipo: cliente.tipo
            }
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});
router.put("/perfil", verificarToken, async (req, res) => {
    try {
        const { username, email, senha } = req.body;

        const cliente = clientes.find(
            cliente => cliente.id === req.usuario.id
        );

        if (!cliente) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        if (username) {
            cliente.username = username;
        }

        if (email) {
            const emailExistente = clientes.find(
                outroCliente =>
                    outroCliente.email === email &&
                    outroCliente.id !== cliente.id
            );

            if (emailExistente) {
                return res.status(409).json({
                    erro: "Este e-mail já está cadastrado."
                });
            }

            cliente.email = email;
        }

        if (senha) {
            cliente.senha = await bcrypt.hash(senha, 10);
        }

        return res.status(200).json({
            mensagem: "Dados atualizados com sucesso!",
            cliente: {
                id: cliente.id,
                username: cliente.username,
                email: cliente.email,
                tipo: cliente.tipo
            }
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});
module.exports = router;