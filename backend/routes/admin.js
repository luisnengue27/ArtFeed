
const express = require("express");
const router = express.Router();

const { poolPromise, sql } = require("../db");
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

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("id", sql.Int, req.usuario.id)
            .query(`
                SELECT id
                FROM dbo.Administradores
                WHERE id = @id AND ativo = 1
            `);

        if (resultado.recordset.length === 0) {
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

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("email", sql.NVarChar(255), email.trim())
            .query(`
                SELECT id, username, email, senha_hash, ativo
                FROM dbo.Administradores
                WHERE email = @email
            `);

        const admin = resultado.recordset[0];

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

            const pool = await poolPromise;

            const senhaHash = await bcrypt.hash(senha, 12);

            await pool.request()
                .input("username", sql.NVarChar(100), username.trim())
                .input("email", sql.NVarChar(255), email.trim())
                .input("senha_hash", sql.NVarChar(255), senhaHash)
                .query(`
                    INSERT INTO dbo.Administradores
                        (username, email, senha_hash)
                    VALUES
                        (@username, @email, @senha_hash)
                `);

            return res.status(201).json({
                mensagem: "Administrador cadastrado com sucesso!"
            });
        } catch (erro) {
            if (erro.number === 2601 || erro.number === 2627) {
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
            const pool = await poolPromise;

  
const resultado = await pool.request().query(`
    SELECT
        id,
        username,
        email,
        ativo,
        data_criacao
    FROM dbo.Administradores
    ORDER BY data_criacao DESC
`);


            return res.json({
                administradores: resultado.recordset
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
