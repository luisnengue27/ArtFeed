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
const { poolNeon } = require("../db");

// ============================
// CADASTRO
// ============================

router.post("/cadastro", async (req, res) => {
    try {
        const { username, email, senha } = req.body;

        if (!username || !email || !senha) {
            return res.status(400).json({
                erro: "Todos os campos sÃ£o obrigatÃ³rios."
            });
        }

const clienteExistente = await poolNeon.query(
    `SELECT id
     FROM clientes
     WHERE email = $1`,
    [email]
);

       if (clienteExistente.rows.length > 0) {
            return res.status(409).json({
                erro: "Este e-mail jÃ¡ estÃ¡ cadastrado."
            });
        }

        const senhaCriptografada = await bcrypt.hash(
            senha,
            10
        );

       const resultado = await poolNeon.query(
        `INSERT INTO clientes (
            username,
            email,
            senha
        )
        VALUES (
            $1, $2, $3
        )
        RETURNING id, username, email`,
        [username, email, senhaCriptografada]
    );

const novoCliente = resultado.rows[0];

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
                erro: "E-mail e senha sÃ£o obrigatÃ³rios."
            });
        }

const resultado = await poolNeon.query(
    `SELECT
        id,
        username,
        email,
        senha
     FROM clientes
     WHERE email = $1`,
    [email]
);

    if (resultado.rows.length === 0) {
    return res.status(401).json({
        erro: "E-mail ou senha incorretos."
    });
}

const cliente = resultado.rows[0];

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

        // Pega o ID do cliente pelo token
        const clienteId = req.usuario.id;

        // Busca o cliente no banco
        const resultado = await poolNeon.query(
            `SELECT
                id,
                username,
                email,
                senha
             FROM clientes
             WHERE id = $1`,
            [clienteId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Cliente nÃ£o encontrado."
            });
        }

        const cliente = resultado.rows[0];

        // Verifica se o novo e-mail jÃ¡ pertence a outro cliente
        if (email && email !== cliente.email) {

            const emailExistente = await poolNeon.query(
                `SELECT id
                 FROM clientes
                 WHERE email = $1
                   AND id <> $2`,
                [email, clienteId]
            );

            if (emailExistente.rows.length > 0) {
                return res.status(409).json({
                    erro: "Este e-mail jÃ¡ estÃ¡ cadastrado."
                });
            }
        }

        // Atualiza username e e-mail
        await poolNeon.query(
            `UPDATE clientes
             SET username = $1,
                 email = $2
             WHERE id = $3`,
            [username || cliente.username, email || cliente.email, clienteId]
        );

        // Atualiza a senha somente se ela foi informada
        if (senha) {

            const senhaCriptografada = await bcrypt.hash(
                senha,
                10
            );

            await poolNeon.query(
                `UPDATE clientes
                 SET senha = $1
                 WHERE id = $2`,
                [senhaCriptografada, clienteId]
            );
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

/* ============================
   ATUALIZAR FOTO DO CLIENTE
============================ */

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
                    erro: "Selecione uma imagem vÃ¡lida."
                });
            }

            const clienteId = req.usuario.id;

            // Verifica se o cliente existe
            const cliente = await poolNeon.query(
                `SELECT id
                 FROM clientes
                 WHERE id = $1`,
                [clienteId]
            );

            if (cliente.rows.length === 0) {
                return res.status(404).json({
                    erro: "Cliente nÃ£o encontrado."
                });
            }

            // Envia a imagem para o Cloudinary
            const imagem = await uploadFotoCliente(
                req.file.buffer,
                clienteId
            );

            // Salva a URL da imagem no banco
            await poolNeon.query(
                `UPDATE clientes
                 SET foto_perfil = $1
                 WHERE id = $2`,
                [imagem.secure_url, clienteId]
            );

            return res.status(200).json({
                mensagem: "Foto de perfil atualizada!",
                foto: imagem.secure_url
            });

        } catch (erro) {
            console.error("Erro ao atualizar foto do cliente:", erro);

            return res.status(500).json({
                erro: "NÃ£o foi possÃ­vel atualizar a foto."
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
                erro: "Esta rota Ã© exclusiva para clientes."
            });
        }

        const resultado = await poolNeon.query(
            `SELECT
                id,
                username,
                email,
                data_cadastro,
                foto_perfil
             FROM clientes
             WHERE id = $1`,
            [req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Cliente nÃ£o encontrado."
            });
        }

        const cliente = resultado.rows[0];

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
            erro: "NÃ£o foi possÃ­vel buscar o perfil."
        });
    }
});


/* ==========================================
   PERFIL PÃšBLICO DO CLIENTE
========================================== */

router.get("/publico/:id", verificarToken, async (req, res) => {
    try {
        const clienteId = Number(req.params.id);

        if (!Number.isInteger(clienteId) || clienteId <= 0) {
            return res.status(400).json({
                erro: "ID de cliente invÃ¡lido."
            });
        }

        const resultado = await poolNeon.query(
            `SELECT
                c.id,
                c.username,
                c.data_cadastro,
                c.foto_perfil,
                CAST(
                    COALESCE(AVG(CAST(ac.nota AS DECIMAL(10,2))), 0)
                    AS DECIMAL(4,2)
                ) AS media_avaliacoes,
                COUNT(ac.id) AS quantidade_avaliacoes
             FROM clientes c
             LEFT JOIN avaliacoes_clientes ac
                 ON ac.cliente_id = c.id
             WHERE c.id = $1
             GROUP BY
                 c.id,
                 c.username,
                 c.data_cadastro,
                 c.foto_perfil`,
            [clienteId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Cliente nÃ£o encontrado."
            });
        }

        const cliente = resultado.rows[0];

        return res.json({
            id: cliente.id,
            username: cliente.username,
            data_cadastro: cliente.data_cadastro,
            foto: cliente.foto_perfil || null,
            media_avaliacoes: Number(cliente.media_avaliacoes),
            quantidade_avaliacoes: cliente.quantidade_avaliacoes
        });
    } catch (erro) {
        console.error("Erro ao buscar perfil pÃºblico:", erro);

        return res.status(500).json({
            erro: "NÃ£o foi possÃ­vel buscar o perfil pÃºblico."
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
                    erro: "ID de cliente invÃ¡lido."
                });
            }

            if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
                return res.status(400).json({
                    erro: "A nota deve ser um nÃºmero inteiro de 1 a 5."
                });
            }

            const pool = await poolNeon.connect();

            try {
                // Confirma que o cliente existe.
                const cliente = await pool.query(
                    `SELECT id
                     FROM clientes
                     WHERE id = $1`,
                    [clienteId]
                );

                if (cliente.rows.length === 0) {
                    return res.status(404).json({
                        erro: "Cliente nÃ£o encontrado."
                    });
                }

                // Insere a avaliaÃ§Ã£o ou atualiza a avaliaÃ§Ã£o existente.
                await pool.query(
                    `INSERT INTO avaliacoes_clientes (
                        cliente_id,
                        artista_id,
                        nota
                    )
                    VALUES (
                        $1, $2, $3
                    )
                    ON CONFLICT (cliente_id, artista_id)
                    DO UPDATE SET nota = EXCLUDED.nota`,
                    [clienteId, artistaId, nota]
                );

                // Retorna a mÃ©dia e a quantidade atualizadas.
                const resumo = await pool.query(
                    `SELECT
                        CAST(
                            COALESCE(AVG(CAST(nota AS DECIMAL(10,2))), 0)
                            AS DECIMAL(4,2)
                        ) AS media_avaliacoes,
                        COUNT(*) AS quantidade_avaliacoes
                     FROM avaliacoes_clientes
                     WHERE cliente_id = $1`,
                    [clienteId]
                );

                return res.json({
                    mensagem: "AvaliaÃ§Ã£o registrada com sucesso!",
                    media_avaliacoes: Number(
                        resumo.rows[0].media_avaliacoes
                    ),
                    quantidade_avaliacoes: resumo.rows[0].quantidade_avaliacoes
                });
            } finally {
                pool.release();
            }

        } catch (erro) {
            console.error("Erro ao avaliar cliente:", erro);

            return res.status(500).json({
                erro: "NÃ£o foi possÃ­vel registrar a avaliaÃ§Ã£o."
            });
        }
    }
);

/* ==========================================
   BUSCAR A AVALIAÃ‡ÃƒO DO ARTISTA LOGADO
========================================== */

router.get(
    "/publico/:id/minha-avaliacao",
    verificarToken,
    async (req, res) => {
        try {
            if (req.usuario.tipo !== "artista") {
                return res.status(403).json({
                    erro: "Somente artistas podem consultar esta avaliaÃ§Ã£o."
                });
            }

            const clienteId = Number(req.params.id);
            const artistaId = req.usuario.id;

            if (!Number.isInteger(clienteId) || clienteId <= 0) {
                return res.status(400).json({
                    erro: "ID de cliente invÃ¡lido."
                });
            }

            // SÃ³ permite consultar a avaliaÃ§Ã£o se houver uma conversa.
            const conversa = await poolNeon.query(
                `SELECT id
                 FROM conversas
                 WHERE artista_id = $1
                   AND cliente_id = $2
                 LIMIT 1`,
                [artistaId, clienteId]
            );

            if (conversa.rows.length === 0) {
                return res.status(403).json({
                    erro: "VocÃª precisa ter uma conversa com este cliente."
                });
            }

            const resultado = await poolNeon.query(
                `SELECT nota
                 FROM avaliacoes_clientes
                 WHERE artista_id = $1
                   AND cliente_id = $2`,
                [artistaId, clienteId]
            );

            return res.json({
                nota: resultado.rows.length > 0
                    ? resultado.rows[0].nota
                    : 0
            });

        } catch (erro) {
            console.error("Erro ao buscar avaliaÃ§Ã£o do artista:", erro);

            return res.status(500).json({
                erro: "NÃ£o foi possÃ­vel consultar sua avaliaÃ§Ã£o."
            });
        }
    }
);

module.exports = router;
