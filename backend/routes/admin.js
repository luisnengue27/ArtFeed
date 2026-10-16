
const express = require("express");
const router = express.Router();

const { poolNeon } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verificarToken = require("../middleware/authMiddleware");

// Verifica se o token pertence a um administrador ativo.
async function verificarAdmin(req, res, next) {
    try {
        if (!req.usuario || req.usuario.tipo !== "admin") {
            return res.status(403).json({
                erro: "Acesso permitido apenas para administradores."
            });
        }

        const resultado = await poolNeon.query(
            `SELECT id
             FROM administradores
             WHERE id = $1
               AND ativo = true`,
            [req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(403).json({
                erro: "Administrador inexistente ou inativo."
            });
        }

        next();
    } catch (erro) {
        console.error("Erro ao verificar administrador:", erro);

        return res.status(500).json({
            erro: "Erro ao verificar permissões administrativas."
        });
    }
}

// LOGIN ADMINISTRATIVO
router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (
            typeof email !== "string" ||
            typeof senha !== "string" ||
            !email.trim() ||
            !senha
        ) {
            return res.status(400).json({
                erro: "Informe o e-mail e a senha."
            });
        }

        const resultado = await poolNeon.query(
            `SELECT id, username, email, senha_hash, ativo
             FROM administradores
             WHERE email = $1`,
            [email.trim()]
        );

        const admin = resultado.rows[0];

        if (!admin || !admin.ativo) {
            return res.status(401).json({
                erro: "E-mail ou senha inválidos."
            });
        }

        const senhaValida = await bcrypt.compare(
            senha,
            admin.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                erro: "E-mail ou senha inválidos."
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                tipo: "admin"
            },
            process.env.JWT_SECRET || "segredo_artfeed",
            {
                expiresIn: "1d"
            }
        );

        return res.json({
            mensagem: "Login realizado com sucesso!",
            token,
            administrador: {
                id: admin.id,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (erro) {
        console.error("Erro no login administrativo:", erro);

        return res.status(500).json({
            erro: "Erro interno ao realizar login."
        });
    }
});

// CADASTRO DE OUTRO ADMINISTRADOR
// Somente um administrador autenticado pode utilizar esta rota.
router.post(
    "/cadastrar",
    verificarToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const { username, email, senha } = req.body;

            if (
                typeof username !== "string" ||
                typeof email !== "string" ||
                typeof senha !== "string" ||
                !username.trim() ||
                !email.trim() ||
                !senha
            ) {
                return res.status(400).json({
                    erro: "Preencha o nome de usuário, o e-mail e a senha."
                });
            }

            if (username.trim().length > 100) {
                return res.status(400).json({
                    erro: "O nome de usuário deve ter até 100 caracteres."
                });
            }

            if (email.trim().length > 255) {
                return res.status(400).json({
                    erro: "O e-mail deve ter até 255 caracteres."
                });
            }

            if (senha.length < 8) {
                return res.status(400).json({
                    erro: "A senha deve ter pelo menos 8 caracteres."
                });
            }

            const senhaHash = await bcrypt.hash(senha, 12);

            await poolNeon.query(
                `INSERT INTO administradores
                    (username, email, senha_hash)
                 VALUES
                    ($1, $2, $3)`,
                [username.trim(), email.trim(), senhaHash]
            );

            return res.status(201).json({
                mensagem: "Administrador cadastrado com sucesso!"
            });
        } catch (erro) {
            if (erro.code === '23505') {
                return res.status(409).json({
                    erro: "Já existe um administrador com esse e-mail."
                });
            }

            console.error("Erro ao cadastrar administrador:", erro);

            return res.status(500).json({
                erro: "Erro interno ao cadastrar administrador."
            });
        }
    }
);

 // LISTAR ADMINISTRADORES
 // Somente administradores ativos podem acessar esta rota.
router.get(
    "/listar",
    verificarToken,
    verificarAdmin,
    async (req, res) => {
        try {


 const resultado = await poolNeon.query(
                `SELECT
                    id,
                    username,
                    email,
                    ativo,
                    data_criacao
                 FROM administradores
                 ORDER BY data_criacao DESC`
            );


            return res.json({
                administradores: resultado.rows
            });
        } catch (erro) {
            console.error("Erro ao listar administradores:", erro);

            return res.status(500).json({
                erro: "Erro interno ao listar administradores."
            });
        }
    }
);

// TESTE DE AUTENTICAÇÃO ADMINISTRATIVA
router.get(
    "/verificar",
    verificarToken,
    verificarAdmin,
    (req, res) => {
        res.json({
            mensagem: "Autenticação administrativa funcionando!",
            administradorId: req.usuario.id
        });
    }
);

module.exports = router;
