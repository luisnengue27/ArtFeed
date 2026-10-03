const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verificarToken = require("../middleware/authMiddleware");

const router = express.Router();

// Temporário, até conectarmos ao SQL Server
const { sql, poolPromise } = require("../db");

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

      const pool = await poolPromise;

const clienteExistente = await pool.request()
    .input("email", sql.NVarChar(150), email)
    .query(`
        SELECT id
        FROM Clientes
        WHERE email = @email
    `);

       if (clienteExistente.recordset.length > 0) {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        const senhaCriptografada = await bcrypt.hash(
            senha,
            10
        );

       const resultado = await pool.request()
    .input("username", sql.NVarChar(50), username)
    .input("email", sql.NVarChar(150), email)
    .input("senha", sql.NVarChar(100), senhaCriptografada)
    .query(`
        INSERT INTO Clientes (
            username,
            email,
            senha
        )
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.email
        VALUES (
            @username,
            @email,
            @senha
        )
    `);

const novoCliente = resultado.recordset[0];

        return res.status(201).json({
            mensagem: "Cliente cadastrado com sucesso!",
           cliente: {
    id: novoCliente.id,
    username: novoCliente.username,
    email: novoCliente.email,
    tipo: "cliente"
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

       const pool = await poolPromise;

const resultado = await pool.request()
    .input("email", sql.NVarChar(150), email)
    .query(`
        SELECT
            id,
            username,
            email,
            senha
        FROM Clientes
        WHERE email = @email
    `);

    if (resultado.recordset.length === 0) {
    return res.status(401).json({
        erro: "E-mail ou senha incorretos."
    });
}

const cliente = resultado.recordset[0];

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
        tipo: "cliente"
    },
    process.env.JWT_SECRET || "segredo_artfeed",
    {
        expiresIn: "1d"
    }
);

        return res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token,

            cliente: {
                id: cliente.id,
                username: cliente.username,
                email: cliente.email,
                tipo: "cliente"
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

        const pool = await poolPromise;

        // Pega o ID do cliente pelo token
        const clienteId = req.usuario.id;

        // Busca o cliente no banco
        const resultado = await pool.request()
            .input("clienteId", sql.Int, clienteId)
            .query(`
                SELECT
                    id,
                    username,
                    email,
                    senha
                FROM Clientes
                WHERE id = @clienteId
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        const cliente = resultado.recordset[0];

        // Verifica se o novo e-mail já pertence a outro cliente
        if (email && email !== cliente.email) {

            const emailExistente = await pool.request()
                .input("email", sql.NVarChar(150), email)
                .input("clienteId", sql.Int, clienteId)
                .query(`
                    SELECT id
                    FROM Clientes
                    WHERE email = @email
                    AND id <> @clienteId
                `);

            if (emailExistente.recordset.length > 0) {
                return res.status(409).json({
                    erro: "Este e-mail já está cadastrado."
                });
            }
        }

        // Atualiza username e e-mail
        await pool.request()
            .input("clienteId", sql.Int, clienteId)
            .input(
                "username",
                sql.NVarChar(50),
                username || cliente.username
            )
            .input(
                "email",
                sql.NVarChar(150),
                email || cliente.email
            )
            .query(`
                UPDATE Clientes
                SET
                    username = @username,
                    email = @email
                WHERE id = @clienteId
            `);

        // Atualiza a senha somente se ela foi informada
        if (senha) {

            const senhaCriptografada = await bcrypt.hash(
                senha,
                10
            );

            await pool.request()
                .input("clienteId", sql.Int, clienteId)
                .input(
                    "senha",
                    sql.NVarChar(100),
                    senhaCriptografada
                )
                .query(`
                    UPDATE Clientes
                    SET senha = @senha
                    WHERE id = @clienteId
                `);
        }

return res.status(200).json({
    mensagem: "Dados atualizados com sucesso!",
    cliente: {
        id: clienteId,
        username: username || cliente.username,
        email: email || cliente.email,
        tipo: "cliente"
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