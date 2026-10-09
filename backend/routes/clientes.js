const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verificarToken = require("../middleware/authMiddleware");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const router = express.Router();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype?.startsWith("image/")) {
            callback(null, true);
        } else {
            callback(new Error("Envie apenas imagens."));
        }
    }
});

const uploadFotoCliente = (buffer, clienteId) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "artfeed/clientes",
                public_id: `cliente-${clienteId}-${Date.now()}`,
                resource_type: "image"
            },
            (erro, resultado) => {
                if (erro) {
                    reject(erro);
                } else {
                    resolve(resultado);
                }
            }
        );

        stream.end(buffer);
    });
};
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
// ============================
// ATUALIZAR FOTO DO CLIENTE
// ============================

router.put(
    "/perfil/foto",
    verificarToken,
    upload.single("foto"),
    async (req, res) => {
        try {
            if (req.usuario.tipo !== "cliente") {
                return res.status(403).json({
                    erro: "Somente clientes podem alterar esta foto."
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    erro: "Selecione uma imagem válida."
                });
            }

            const clienteId = req.usuario.id;
            const pool = await poolPromise;

            const cliente = await pool.request()
                .input("id", sql.Int, clienteId)
                .query(`
                    SELECT id
                    FROM Clientes
                    WHERE id = @id
                `);
                
            // Verifica se o artista já possui uma conversa com o cliente.
            const conversa = await pool.request()
                .input("artista_id", sql.Int, artistaId)
                .input("cliente_id", sql.Int, clienteId)
                .query(`
                    SELECT TOP 1 id
                    FROM Conversas
                    WHERE artista_id = @artista_id
                      AND cliente_id = @cliente_id
                `);

            if (conversa.recordset.length === 0) {
                return res.status(403).json({
                    erro: "Você precisa ter uma conversa com este cliente antes de avaliá-lo."
                });
            }

            if (cliente.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Cliente não encontrado."
                });
            }

            const imagem = await uploadFotoCliente(
                req.file.buffer,
                clienteId
            );

            await pool.request()
                .input("id", sql.Int, clienteId)
                .input(
                    "foto",
                    sql.NVarChar(500),
                    imagem.secure_url
                )
                .query(`
                    UPDATE Clientes
                    SET foto_perfil = @foto
                    WHERE id = @id
                `);

            return res.status(200).json({
                mensagem: "Foto de perfil atualizada!",
                foto: imagem.secure_url
            });

        } catch (erro) {
            console.error("Erro ao atualizar foto do cliente:", erro);

            return res.status(500).json({
                erro: "Não foi possível atualizar a foto."
            });
        }
    }
);
// ============================
// CONSULTAR MEU PERFIL
// ============================

router.get("/perfil", verificarToken, async (req, res) => {
    try {
        if (req.usuario.tipo !== "cliente") {
            return res.status(403).json({
                erro: "Esta rota é exclusiva para clientes."
            });
        }

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("id", sql.Int, req.usuario.id)
            .query(`
                SELECT
                    id,
                    username,
                    email,
                    data_cadastro,
                    foto_perfil
                FROM Clientes
                WHERE id = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        const cliente = resultado.recordset[0];

        return res.json({
            id: cliente.id,
            username: cliente.username,
            email: cliente.email,
            data_cadastro: cliente.data_cadastro,
            foto: cliente.foto_perfil || null,
            tipo: "cliente"
        });

    } catch (erro) {
        console.error("Erro ao consultar perfil do cliente:", erro);

        return res.status(500).json({
            erro: "Não foi possível buscar o perfil."
        });
    }
});



/* ==========================================
   PERFIL PÚBLICO DO CLIENTE
========================================== */

router.get("/publico/:id", verificarToken, async (req, res) => {
    try {
        const clienteId = Number(req.params.id);

        if (!Number.isInteger(clienteId) || clienteId <= 0) {
            return res.status(400).json({
                erro: "ID de cliente inválido."
            });
        }

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("id", sql.Int, clienteId)
            .query(`
                SELECT
                    c.id,
                    c.username,
                    c.data_cadastro,
                    c.foto_perfil,
                    CAST(
                        COALESCE(AVG(CAST(ac.nota AS DECIMAL(10,2))), 0)
                        AS DECIMAL(4,2)
                    ) AS media_avaliacoes,
                    COUNT(ac.id) AS quantidade_avaliacoes
                FROM Clientes c
                LEFT JOIN AvaliacoesClientes ac
                    ON ac.cliente_id = c.id
                WHERE c.id = @id
                GROUP BY
                    c.id,
                    c.username,
                    c.data_cadastro,
                    c.foto_perfil
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        const cliente = resultado.recordset[0];

        return res.json({
            id: cliente.id,
            username: cliente.username,
            data_cadastro: cliente.data_cadastro,
            foto: cliente.foto_perfil || null,
            media_avaliacoes: Number(cliente.media_avaliacoes),
            quantidade_avaliacoes: cliente.quantidade_avaliacoes
        });
    } catch (erro) {
        console.error("Erro ao buscar perfil público:", erro);

        return res.status(500).json({
            erro: "Não foi possível buscar o perfil público."
        });
    }
});

/* ==========================================
   ARTISTA AVALIA UM CLIENTE
========================================== */

router.put(
    "/publico/:id/avaliacao",
    verificarToken,
    async (req, res) => {
        try {
            // Somente artistas podem avaliar clientes.
            if (req.usuario.tipo !== "artista") {
                return res.status(403).json({
                    erro: "Somente artistas podem avaliar clientes."
                });
            }

            const clienteId = Number(req.params.id);
            const artistaId = req.usuario.id;
            const nota = Number(req.body.nota);

            if (!Number.isInteger(clienteId) || clienteId <= 0) {
                return res.status(400).json({
                    erro: "ID de cliente inválido."
                });
            }

            if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
                return res.status(400).json({
                    erro: "A nota deve ser um número inteiro de 1 a 5."
                });
            }

            const pool = await poolPromise;

            // Confirma que o cliente existe.
            const cliente = await pool.request()
                .input("id", sql.Int, clienteId)
                .query(`
                    SELECT id
                    FROM Clientes
                    WHERE id = @id
                `);

            if (cliente.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Cliente não encontrado."
                });
            }

            // Insere a avaliação ou atualiza a avaliação existente.
            await pool.request()
                .input("cliente_id", sql.Int, clienteId)
                .input("artista_id", sql.Int, artistaId)
                .input("nota", sql.TinyInt, nota)
                .query(`
                    UPDATE AvaliacoesClientes
                    SET
                        nota = @nota,
                        data_avaliacao = GETDATE()
                    WHERE cliente_id = @cliente_id
                      AND artista_id = @artista_id;

                    IF @@ROWCOUNT = 0
                    BEGIN
                        INSERT INTO AvaliacoesClientes (
                            cliente_id,
                            artista_id,
                            nota
                        )
                        VALUES (
                            @cliente_id,
                            @artista_id,
                            @nota
                        );
                    END
                `);

            // Retorna a média e a quantidade atualizadas.
            const resumo = await pool.request()
                .input("cliente_id", sql.Int, clienteId)
                .query(`
                    SELECT
                        CAST(
                            COALESCE(
                                AVG(CAST(nota AS DECIMAL(10,2))),
                                0
                            ) AS DECIMAL(4,2)
                        ) AS media_avaliacoes,
                        COUNT(*) AS quantidade_avaliacoes
                    FROM AvaliacoesClientes
                    WHERE cliente_id = @cliente_id
                `);

            return res.json({
                mensagem: "Avaliação registrada com sucesso!",
                media_avaliacoes: Number(
                    resumo.recordset[0].media_avaliacoes
                ),
                quantidade_avaliacoes:
                    resumo.recordset[0].quantidade_avaliacoes
            });

        } catch (erro) {
            console.error("Erro ao avaliar cliente:", erro);

            return res.status(500).json({
                erro: "Não foi possível registrar a avaliação."
            });
        }
    }
);

/* ==========================================
   BUSCAR A AVALIAÇÃO DO ARTISTA LOGADO
========================================== */

router.get(
    "/publico/:id/minha-avaliacao",
    verificarToken,
    async (req, res) => {
        try {
            if (req.usuario.tipo !== "artista") {
                return res.status(403).json({
                    erro: "Somente artistas podem consultar esta avaliação."
                });
            }

            const clienteId = Number(req.params.id);
            const artistaId = req.usuario.id;

            if (!Number.isInteger(clienteId) || clienteId <= 0) {
                return res.status(400).json({
                    erro: "ID de cliente inválido."
                });
            }

            const pool = await poolPromise;

            // Só permite consultar a avaliação se houver uma conversa.
            const conversa = await pool.request()
                .input("artista_id", sql.Int, artistaId)
                .input("cliente_id", sql.Int, clienteId)
                .query(`
                    SELECT TOP 1 id
                    FROM Conversas
                    WHERE artista_id = @artista_id
                      AND cliente_id = @cliente_id
                `);

            if (conversa.recordset.length === 0) {
                return res.status(403).json({
                    erro: "Você precisa ter uma conversa com este cliente."
                });
            }

            const resultado = await pool.request()
                .input("artista_id", sql.Int, artistaId)
                .input("cliente_id", sql.Int, clienteId)
                .query(`
                    SELECT nota
                    FROM AvaliacoesClientes
                    WHERE artista_id = @artista_id
                      AND cliente_id = @cliente_id
                `);

            return res.json({
                nota: resultado.recordset.length > 0
                    ? resultado.recordset[0].nota
                    : 0
            });

        } catch (erro) {
            console.error("Erro ao buscar avaliação do artista:", erro);

            return res.status(500).json({
                erro: "Não foi possível consultar sua avaliação."
            });
        }
    }
);
module.exports = router;