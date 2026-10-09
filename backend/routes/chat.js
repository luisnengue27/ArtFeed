const express = require("express");
const router = express.Router();

const { poolPromise } = require("../db");
const verificarToken = require("../middleware/authMiddleware");

const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

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
            callback(new Error("Envie apenas arquivos de imagem."));
        }
    }
});

const uploadParaCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "artfeed/chat",
                resource_type: "image"
            },
            (error, resultado) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(resultado);
                }
            }
        );

        stream.end(buffer);
    });
};

// ==========================================
// CRIAR OU ENCONTRAR UMA CONVERSA
// ==========================================
router.post("/conversa", verificarToken, async (req, res) => {
    try {
        const { artista_id, cliente_id } = req.body;

        const tipo = req.usuario.tipo;
        const usuarioId = req.usuario.id;

        const pool = await poolPromise;


        // ==========================================
        // ARTISTA INICIANDO CONVERSA
        // ==========================================
        if (tipo === "artista") {
console.log("CHAT ARTISTA");
console.log("usuarioId:", usuarioId);
console.log("artista_id recebido:", artista_id);
            if (!artista_id) {
                return res.status(400).json({
                    erro: "artista_id é obrigatório"
                });
            }


            // Artista conversando com outro artista
            if (artista_id != usuarioId) {

                const existente = await pool.request()
                    .input("artista_id", usuarioId)
                    .input("artista_destino_id", artista_id)
                    .query(`
                        SELECT
                            id,
                            artista_id,
                            cliente_id,
                            artista_destino_id,
                            data_criacao
                        FROM Conversas
                        WHERE
                            (
                                artista_id = @artista_id
                                AND artista_destino_id = @artista_destino_id
                            )
                            OR
                            (
                                artista_id = @artista_destino_id
                                AND artista_destino_id = @artista_id
                            )
                    `);

                if (existente.recordset.length > 0) {
                    return res.json(existente.recordset[0]);
                }


                const nova = await pool.request()
                    .input("artista_id", usuarioId)
                    .input("artista_destino_id", artista_id)
                    .query(`
                        INSERT INTO Conversas (
                            artista_id,
                            artista_destino_id
                        )
                        OUTPUT
                            INSERTED.id,
                            INSERTED.artista_id,
                            INSERTED.cliente_id,
                            INSERTED.artista_destino_id,
                            INSERTED.data_criacao
                        VALUES (
                            @artista_id,
                            @artista_destino_id
                        )
                    `);

                return res.status(201).json(nova.recordset[0]);
            }


            // ==========================================
            // ARTISTA CONVERSANDO COM CLIENTE
            // ==========================================

            if (!cliente_id) {
                return res.status(400).json({
                    erro: "cliente_id é obrigatório"
                });
            }


            const existente = await pool.request()
                .input("artista_id", usuarioId)
                .input("cliente_id", cliente_id)
                .query(`
                    SELECT
                        id,
                        artista_id,
                        cliente_id,
                        artista_destino_id,
                        data_criacao
                    FROM Conversas
                    WHERE artista_id = @artista_id
                      AND cliente_id = @cliente_id
                `);


            if (existente.recordset.length > 0) {
                return res.json(existente.recordset[0]);
            }


            const nova = await pool.request()
                .input("artista_id", usuarioId)
                .input("cliente_id", cliente_id)
                .query(`
                    INSERT INTO Conversas (
                        artista_id,
                        cliente_id
                    )
                    OUTPUT
                        INSERTED.id,
                        INSERTED.artista_id,
                        INSERTED.cliente_id,
                        INSERTED.artista_destino_id,
                        INSERTED.data_criacao
                    VALUES (
                        @artista_id,
                        @cliente_id
                    )
                `);


            return res.status(201).json(nova.recordset[0]);
        }


        // ==========================================
        // CLIENTE INICIANDO CONVERSA
        // ==========================================

        if (tipo === "cliente") {
console.log("CHAT CLIENTE");
console.log("usuarioId:", usuarioId);
console.log("artista_id recebido:", artista_id);
            if (!artista_id) {
                return res.status(400).json({
                    erro: "artista_id é obrigatório"
                });
            }


            const existente = await pool.request()
                .input("artista_id", artista_id)
                .input("cliente_id", usuarioId)
                .query(`
                    SELECT
                        id,
                        artista_id,
                        cliente_id,
                        artista_destino_id,
                        data_criacao
                    FROM Conversas
                    WHERE artista_id = @artista_id
                      AND cliente_id = @cliente_id
                `);


            if (existente.recordset.length > 0) {
                return res.json(existente.recordset[0]);
            }


            const nova = await pool.request()
                .input("artista_id", artista_id)
                .input("cliente_id", usuarioId)
                .query(`
                    INSERT INTO Conversas (
                        artista_id,
                        cliente_id
                    )
                    OUTPUT
                        INSERTED.id,
                        INSERTED.artista_id,
                        INSERTED.cliente_id,
                        INSERTED.artista_destino_id,
                        INSERTED.data_criacao
                    VALUES (
                        @artista_id,
                        @cliente_id
                    )
                `);


            return res.status(201).json(nova.recordset[0]);
        }


        return res.status(403).json({
            erro: "Tipo de usuário inválido"
        });


    } catch (error) {

        console.error("Erro ao criar conversa:", error);

        res.status(500).json({
            erro: "Erro ao criar conversa"
        });
    }
});


// ==========================================
// BUSCAR MENSAGENS DE UMA CONVERSA
// ==========================================
router.get("/conversa/:id/mensagens", verificarToken, async (req, res) => {

    try {

        const conversaId = req.params.id;
        const usuarioId = req.usuario.id;
        const tipo = req.usuario.tipo;

        const pool = await poolPromise;


        // Verifica se a conversa existe
        const conversa = await pool.request()
            .input("id", conversaId)
            .query(`
                SELECT
                    id,
                    artista_id,
                    cliente_id,
                    artista_destino_id
                FROM Conversas
                WHERE id = @id
            `);


        if (conversa.recordset.length === 0) {

            return res.status(404).json({
                erro: "Conversa não encontrada"
            });
        }


        const dados = conversa.recordset[0];


        // Verifica se o usuário pertence à conversa
        const autorizado =
            (
                tipo === "artista" &&
                (
                    dados.artista_id === usuarioId ||
                    dados.artista_destino_id === usuarioId
                )
            )
            ||
            (
                tipo === "cliente" &&
                dados.cliente_id === usuarioId
            );


        if (!autorizado) {

            return res.status(403).json({
                erro: "Você não pertence a esta conversa"
            });
        }


        const mensagens = await pool.request()
            .input("conversa_id", conversaId)
            .query(`
                SELECT
                    id,
                    conversa_id,
                    remetente_tipo,
                    remetente_id,
                    texto,
                    imagem,
                    data_envio
                FROM Mensagens
                WHERE conversa_id = @conversa_id
                ORDER BY data_envio ASC
            `);


        res.json(mensagens.recordset);


    } catch (error) {

        console.error("Erro ao buscar mensagens:", error);

        res.status(500).json({
            erro: "Erro ao buscar mensagens"
        });
    }
});


// ==========================================
// ENVIAR MENSAGEM DE TEXTO
// ==========================================
router.post("/conversa/:id/mensagens", verificarToken, async (req, res) => {

    try {

        const conversaId = req.params.id;
        const { texto } = req.body;


        if (!texto || !texto.trim()) {

            return res.status(400).json({
                erro: "A mensagem não pode estar vazia"
            });
        }


        const usuarioId = req.usuario.id;
        const tipo = req.usuario.tipo;

        const pool = await poolPromise;


        // Verifica se a conversa existe
        const conversa = await pool.request()
            .input("id", conversaId)
            .query(`
                SELECT
                    id,
                    artista_id,
                    cliente_id,
                    artista_destino_id
                FROM Conversas
                WHERE id = @id
            `);


        if (conversa.recordset.length === 0) {

            return res.status(404).json({
                erro: "Conversa não encontrada"
            });
        }


        const dados = conversa.recordset[0];


        // Verifica se o usuário pertence à conversa
        const autorizado =
            (
                tipo === "artista" &&
                (
                    dados.artista_id === usuarioId ||
                    dados.artista_destino_id === usuarioId
                )
            )
            ||
            (
                tipo === "cliente" &&
                dados.cliente_id === usuarioId
            );


        if (!autorizado) {

            return res.status(403).json({
                erro: "Você não pertence a esta conversa"
            });
        }


        const mensagem = await pool.request()
            .input("conversa_id", conversaId)
            .input("remetente_tipo", tipo)
            .input("remetente_id", usuarioId)
            .input("texto", texto.trim())
            .query(`
                INSERT INTO Mensagens (
                    conversa_id,
                    remetente_tipo,
                    remetente_id,
                    texto
                )
                OUTPUT
                    INSERTED.id,
                    INSERTED.conversa_id,
                    INSERTED.remetente_tipo,
                    INSERTED.remetente_id,
                    INSERTED.texto,
                    INSERTED.imagem,
                    INSERTED.data_envio
                VALUES (
                    @conversa_id,
                    @remetente_tipo,
                    @remetente_id,
                    @texto
                )
            `);


        res.status(201).json(mensagem.recordset[0]);


    } catch (error) {

        console.error("Erro ao enviar mensagem:", error);

        res.status(500).json({
            erro: "Erro ao enviar mensagem"
        });
    }
});

// ==========================================
// LISTAR CONVERSAS DO USUÁRIO
// ==========================================
router.get("/conversas", verificarToken, async (req, res) => {

    try {

        const usuarioId = req.usuario.id;
        const tipo = req.usuario.tipo;

        const pool = await poolPromise;

        let resultado;


        // ==========================================
        // CLIENTE
        // ==========================================

        if (tipo === "cliente") {

            resultado = await pool.request()
                .input("cliente_id", usuarioId)
                .query(`
                    SELECT
                        c.id AS conversa_id,
                        c.artista_id,
                        a.username AS artista_username,
                        m.texto AS ultima_mensagem,
                        m.data_envio AS ultima_mensagem_data
                    FROM Conversas c

                    INNER JOIN Artistas a
                        ON a.id = c.artista_id

                    OUTER APPLY (
                        SELECT TOP 1
                            texto,
                            data_envio
                        FROM Mensagens
                        WHERE conversa_id = c.id
                        ORDER BY data_envio DESC
                    ) m

                    WHERE c.cliente_id = @cliente_id

                    ORDER BY
                        m.data_envio DESC,
                        c.data_criacao DESC
                `);

            return res.json(resultado.recordset);
        }


        // ==========================================
        // ARTISTA
        // ==========================================

    // ==========================================
// ARTISTA
// ==========================================

if (tipo === "artista") {

    resultado = await pool.request()
        .input("artista_id", usuarioId)
        .query(`
            SELECT
                c.id AS conversa_id,

                CASE
                    WHEN c.cliente_id IS NOT NULL
                        THEN c.cliente_id
                    WHEN c.artista_id = @artista_id
                        THEN c.artista_destino_id
                    ELSE c.artista_id
                END AS outro_usuario_id,

                CASE
                    WHEN c.cliente_id IS NOT NULL
                        THEN cliente.username
                    WHEN c.artista_id = @artista_id
                        THEN destino.username
                    ELSE origem.username
                END AS outro_username,

                CASE
                    WHEN c.cliente_id IS NOT NULL
                        THEN 'cliente'
                    ELSE 'artista'
                END AS outro_tipo,

                m.texto AS ultima_mensagem,
                m.data_envio AS ultima_mensagem_data

            FROM Conversas c

            LEFT JOIN Artistas origem
                ON origem.id = c.artista_id

            LEFT JOIN Artistas destino
                ON destino.id = c.artista_destino_id

            LEFT JOIN Clientes cliente
                ON cliente.id = c.cliente_id

            OUTER APPLY (
                SELECT TOP 1
                    texto,
                    data_envio
                FROM Mensagens
                WHERE conversa_id = c.id
                ORDER BY data_envio DESC
            ) m

            WHERE
                c.artista_id = @artista_id
                OR c.artista_destino_id = @artista_id

            ORDER BY
                m.data_envio DESC,
                c.data_criacao DESC
        `);

    return res.json(resultado.recordset);
}


        return res.status(403).json({
            erro: "Tipo de usuário inválido"
        });


    } catch (error) {

        console.error("Erro ao listar conversas:", error);

        res.status(500).json({
            erro: "Erro ao listar conversas"
        });
    }
});

router.post(
    "/conversa/:id/imagem",
    verificarToken,
    upload.single("imagem"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    erro: "Selecione uma imagem válida."
                });
            }

            const conversaId = req.params.id;
            const usuarioId = req.usuario.id;
            const tipo = req.usuario.tipo;

            const pool = await poolPromise;

            const conversa = await pool.request()
                .input("id", conversaId)
                .query(`
                    SELECT id, artista_id, cliente_id, artista_destino_id
                    FROM Conversas
                    WHERE id = @id
                `);

            if (conversa.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Conversa não encontrada."
                });
            }

            const dados = conversa.recordset[0];

            const autorizado =
                (
                    tipo === "artista" &&
                    (
                        dados.artista_id === usuarioId ||
                        dados.artista_destino_id === usuarioId
                    )
                ) ||
                (
                    tipo === "cliente" &&
                    dados.cliente_id === usuarioId
                );

            if (!autorizado) {
                return res.status(403).json({
                    erro: "Você não pertence a esta conversa."
                });
            }

            const resultado = await uploadParaCloudinary(
                req.file.buffer
            );

            const mensagem = await pool.request()
                .input("conversa_id", conversaId)
                .input("remetente_tipo", tipo)
                .input("remetente_id", usuarioId)
                .input("imagem", resultado.secure_url)
                .query(`
                    INSERT INTO Mensagens (
                        conversa_id,
                        remetente_tipo,
                        remetente_id,
                        imagem
                    )
                    OUTPUT
                        INSERTED.id,
                        INSERTED.conversa_id,
                        INSERTED.remetente_tipo,
                        INSERTED.remetente_id,
                        INSERTED.texto,
                        INSERTED.imagem,
                        INSERTED.data_envio
                    VALUES (
                        @conversa_id,
                        @remetente_tipo,
                        @remetente_id,
                        @imagem
                    )
                `);

            return res.status(201).json(mensagem.recordset[0]);

        } catch (error) {
            console.error("Erro ao enviar imagem:", error);

            return res.status(500).json({
                erro: "Erro ao enviar imagem."
            });
        }
    }
);

router.get("/conversa/:id/detalhes", verificarToken, async (req, res) => {
    try {
        const conversaId = Number(req.params.id);
        const usuarioId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;

        if (!Number.isInteger(conversaId) || conversaId <= 0) {
            return res.status(400).json({
                erro: "ID de conversa inválido."
            });
        }

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("id", conversaId)
            .query(`
              
SELECT
    c.id,
    c.artista_id,
    c.cliente_id,
    c.artista_destino_id,
    cliente.username AS cliente_username,
    cliente.foto_perfil AS cliente_foto,
    origem.username AS origem_username,
    CAST(NULL AS NVARCHAR(MAX)) AS origem_foto,
    destino.username AS destino_username,
    CAST(NULL AS NVARCHAR(MAX)) AS destino_foto
FROM Conversas c
LEFT JOIN Clientes cliente
    ON cliente.id = c.cliente_id
LEFT JOIN Artistas origem
    ON origem.id = c.artista_id
LEFT JOIN Artistas destino
    ON destino.id = c.artista_destino_id
WHERE c.id = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                erro: "Conversa não encontrada."
            });
        }

        const conversa = resultado.recordset[0];

        const autorizado =
            tipo === "cliente"
                ? Number(conversa.cliente_id) === usuarioId
                : tipo === "artista" &&
                    (
                        Number(conversa.artista_id) === usuarioId ||
                        Number(conversa.artista_destino_id) === usuarioId
                    );

        if (!autorizado) {
            return res.status(403).json({
                erro: "Você não pertence a esta conversa."
            });
        }

        let outroUsuario;

        if (conversa.cliente_id !== null) {
            if (tipo === "cliente") {
                outroUsuario = {
                    id: conversa.artista_id,
                    tipo: "artista",
                    username: conversa.origem_username,
                    foto: conversa.origem_foto || null
                };
            } else {
                outroUsuario = {
                    id: conversa.cliente_id,
                    tipo: "cliente",
                    username: conversa.cliente_username,
                    foto: conversa.cliente_foto || "/avatar-padrao.png"
                };
            }
        } else if (Number(conversa.artista_id) === usuarioId) {
            outroUsuario = {
                id: conversa.artista_destino_id,
                tipo: "artista",
                username: conversa.destino_username,
                foto: conversa.destino_foto || null
            };
        } else {
            outroUsuario = {
                id: conversa.artista_id,
                tipo: "artista",
                username: conversa.origem_username,
                foto: conversa.origem_foto || null
            };
        }

        return res.json(outroUsuario);

    } catch (error) {
        console.error("Erro ao buscar detalhes da conversa:", error);

        return res.status(500).json({
            erro: "Não foi possível buscar os detalhes da conversa."
        });
    }
});
module.exports = router;