const express = require("express");
const router = express.Router();

const { poolNeon } = require("../db");
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

async function existeBloqueioEntreUsuarios(
    usuarioId,
    tipoUsuario,
    outroId,
    tipoOutro
) {
    const resultado = await poolNeon.query(
        `SELECT id
         FROM artistas_bloqueados
         WHERE
             (
                 usuario_id = $1
                 AND usuario_tipo = $2
                 AND $3 = 'artista'
                 AND artista_id = $4
             )
             OR
             (
                 $2 = 'artista'
                 AND usuario_id = $4
                 AND usuario_tipo = $3
                 AND artista_id = $1
             )
         LIMIT 1`,
        [usuarioId, tipoUsuario, tipoOutro, outroId]
    );

    return resultado.rows.length > 0;
}

// ==========================================
// CRIAR OU ENCONTRAR UMA CONVERSA
// ==========================================
router.post("/conversa", verificarToken, async (req, res) => {
    try {
        const { artista_id, cliente_id } = req.body;

        const tipo = req.usuario.tipo;
        const usuarioId = Number(req.usuario.id);

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({
                erro: "ID de usuário inválido"
            });
        }



        // ==========================================
        // ARTISTA INICIANDO CONVERSA
        // ==========================================
        if (tipo === "artista") {

            if (!artista_id || !Number.isInteger(Number(artista_id)) || Number(artista_id) <= 0) {
                return res.status(400).json({
                    erro: "artista_id é obrigatório"
                });
            }


            // Artista conversando com outro artista
            if (artista_id != usuarioId) {
const bloqueio = await existeBloqueioEntreUsuarios(
    poolNeon,
    usuarioId,
    tipo,
    Number(artista_id),
    "artista"
);

if (bloqueio) {
    return res.status(403).json({
        erro: "Não é possível conversar devido a um bloqueio entre as contas."
    });
}
                const existente = await poolNeon.query(`
                        SELECT
                            id,
                            artista_id,
                            cliente_id,
                            artista_destino_id,
                            data_criacao
                        FROM conversas
                        WHERE
                            (
                                artista_id = $1
                                AND artista_destino_id = $2
                            )
                            OR
                            (
                                artista_id = $3
                                AND artista_destino_id = $4
                            )
                    `, [usuarioId, Number(artista_id), Number(artista_id), usuarioId]);

                if (existente.rows.length > 0) {
                    return res.json(existente.rows[0]);
                }


                const nova = await poolNeon.query(`
                        INSERT INTO conversas (
                            artista_id,
                            artista_destino_id
                        )
                        VALUES (
                            $1,
                            $2
                        )
                        RETURNING id,
                            artista_id,
                            cliente_id,
                            artista_destino_id,
                            data_criacao
                    `, [usuarioId, Number(artista_id)]);

                return res.status(201).json(nova.rows[0]);
            }


            // ==========================================
            // ARTISTA CONVERSANDO COM CLIENTE
            // ==========================================

            if (!cliente_id || !Number.isInteger(Number(cliente_id)) || Number(cliente_id) <= 0) {
                return res.status(400).json({
                    erro: "cliente_id é obrigatório"
                });
            }
const bloqueio = await existeBloqueioEntreUsuarios(
    poolNeon,
    usuarioId,
    tipo,
    Number(cliente_id),
    "cliente"
);

if (bloqueio) {
    return res.status(403).json({
        erro: "Não é possível conversar devido a um bloqueio entre as contas."
    });
}

            const existente = await poolNeon.query(`
                    SELECT
                        id,
                        artista_id,
                        cliente_id,
                        artista_destino_id,
                        data_criacao
                    FROM conversas
                    WHERE artista_id = $1
                      AND cliente_id = $2
                `, [artista_id, cliente_id]);


            if (existente.rows.length > 0) {
                return res.json(existente.rows[0]);
            }


            const nova = await poolNeon.query(`
                    INSERT INTO conversas (
                        artista_id,
                        cliente_id
                    )
                    VALUES (
                        $1,
                        $2
                    )
                    RETURNING id,
                        artista_id,
                        cliente_id,
                        artista_destino_id,
                        data_criacao
                `, [artista_id, cliente_id]);


            return res.status(201).json(nova.rows[0]);
        }


        // ==========================================
        // CLIENTE INICIANDO CONVERSA
        // ==========================================

        if (tipo === "cliente") {

            if (!artista_id || !Number.isInteger(Number(artista_id)) || Number(artista_id) <= 0) {
                return res.status(400).json({
                    erro: "artista_id é obrigatório"
                });
            }
const bloqueio = await existeBloqueioEntreUsuarios(
    poolNeon,
    usuarioId,
    tipo,
    Number(artista_id),
    "artista"
);

if (bloqueio) {
    return res.status(403).json({
        erro: "Não é possível conversar devido a um bloqueio entre as contas."
    });
}

            const existente = await poolNeon.query(`
                    SELECT
                        id,
                        artista_id,
                        cliente_id,
                        artista_destino_id,
                        data_criacao
                    FROM conversas
                    WHERE artista_id = $1
                      AND cliente_id = $2
                `, [artista_id, cliente_id]);


            if (existente.rows.length > 0) {
                return res.json(existente.rows[0]);
            }


            const nova = await poolNeon.query(`
                    INSERT INTO conversas (
                        artista_id,
                        cliente_id
                    )
                    VALUES (
                        $1,
                        $2
                    )
                    RETURNING id,
                        artista_id,
                        cliente_id,
                        artista_destino_id,
                        data_criacao
                `, [artista_id, cliente_id]);


            return res.status(201).json(nova.rows[0]);
        }


        return res.status(403).json({
            erro: "Tipo de usuário inválido"
        });


    } catch (error) {

        console.error("Erro ao criar conversa:", error);

        return res.status(500).json({
            erro: "Erro ao criar conversa"
        });
    }
});
// ==========================================
// BUSCAR MENSAGENS DE UMA CONVERSA
// ==========================================
router.get("/conversa/:id/mensagens", verificarToken, async (req, res) => {
    try {
        const conversaId = Number(req.params.id);
        const usuarioId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;

        if (!Number.isInteger(conversaId) || conversaId <= 0) {
            return res.status(400).json({
                erro: "ID de conversa inválido"
            });
        }


        // Verifica se a conversa existe
        const conversa = await poolNeon.query(`
                SELECT
                    id,
                    artista_id,
                    cliente_id,
                    artista_destino_id
                FROM conversas
                WHERE id = $1
            `, [conversaId]);

        if (conversa.rows.length === 0) {
            return res.status(404).json({
                erro: "Conversa não encontrada"
            });
        }

        const dados = conversa.rows[0];

        // Verifica se o usuário pertence à conversa
        const autorizado =
            (
                tipo === "artista" &&
                (
                    Number(dados.artista_id) === usuarioId ||
                    Number(dados.artista_destino_id) === usuarioId
                )
            ) ||
            (
                tipo === "cliente" &&
                Number(dados.cliente_id) === usuarioId
            );

        if (!autorizado) {
            return res.status(403).json({
                erro: "Você não pertence a esta conversa"
            });
        }
const outroId =
    tipo === "cliente"
        ? dados.artista_id
        : dados.cliente_id !== null
            ? dados.cliente_id
            : (
                Number(dados.artista_id) === Number(usuarioId)
                    ? dados.artista_destino_id
                    : dados.artista_id
            );

const outroTipo =
    tipo === "cliente" || dados.cliente_id !== null
        ? (tipo === "cliente" ? "artista" : "cliente")
        : "artista";

const bloqueio = await existeBloqueioEntreUsuarios(
    poolNeon,
    usuarioId,
    tipo,
    Number(outroId),
    outroTipo
);

if (bloqueio) {
    return res.status(403).json({
        erro: "Não é possível enviar mensagens devido a um bloqueio entre as contas."
    });
}
        // Busca as mensagens e o username de cada remetente
        const mensagens = await poolNeon.query(`
                SELECT
                    m.id,
                    m.conversa_id,
                    m.remetente_tipo,
                    m.remetente_id,
                    CASE
                        WHEN m.remetente_tipo = 'artista'
                            THEN a.username
                        WHEN m.remetente_tipo = 'cliente'
                            THEN c.username
                    END AS remetente_username,
                    m.texto,
                    m.imagem,
                    m.data_envio
                FROM mensagens m

                LEFT JOIN Artistas a
                    ON m.remetente_tipo = 'artista'
                    AND a.id = m.remetente_id

                LEFT JOIN Clientes c
                    ON m.remetente_tipo = 'cliente'
                    AND c.id = m.remetente_id

                WHERE m.conversa_id = $1

                ORDER BY
                    m.data_envio ASC,
                    m.id ASC
            `, [conversaId]);

        return res.json(mensagens.rows);

    } catch (error) {
        console.error("Erro ao buscar mensagens:", error);

        return res.status(500).json({
            erro: "Erro ao buscar mensagens"
        });
    }
});



// ==========================================
// ENVIAR MENSAGEM DE TEXTO
// ==========================================
router.post("/conversa/:id/mensagens", verificarToken, async (req, res) => {

    try {

        const conversaId = Number(req.params.id);
        const { texto } = req.body;

        if (!Number.isInteger(conversaId) || conversaId <= 0) {
            return res.status(400).json({
                erro: "ID de conversa inválido"
            });
        }

        if (!texto || !texto.trim()) {

            return res.status(400).json({
                erro: "A mensagem não pode estar vazia"
            });
        }


        const usuarioId = req.usuario.id;
        const tipo = req.usuario.tipo;



        // Verifica se a conversa existe
        const conversa = await poolNeon.query(`
                SELECT
                    id,
                    artista_id,
                    cliente_id,
                    artista_destino_id
                FROM conversas
                WHERE id = $1
            `, [conversaId]);


        if (conversa.rows.length === 0) {

            return res.status(404).json({
                erro: "Conversa não encontrada"
            });
        }


        const dados = conversa.rows[0];


        // Verifica se o usuário pertence à conversa
       
const autorizado =
    (
        tipo === "artista" &&
        (
            Number(dados.artista_id) === Number(usuarioId) ||
            Number(dados.artista_destino_id) === Number(usuarioId)
        )
    ) ||
    (
        tipo === "cliente" &&
        Number(dados.cliente_id) === Number(usuarioId)
    );


        if (!autorizado) {

            return res.status(403).json({
                erro: "Você não pertence a esta conversa"
            });
        }
const outroId =
    tipo === "cliente"
        ? dados.artista_id
        : dados.cliente_id !== null
            ? dados.cliente_id
            : (
                Number(dados.artista_id) === Number(usuarioId)
                    ? dados.artista_destino_id
                    : dados.artista_id
            );

const outroTipo =
    tipo === "cliente" || dados.cliente_id !== null
        ? (tipo === "cliente" ? "artista" : "cliente")
        : "artista";

const bloqueio = await existeBloqueioEntreUsuarios(
    poolNeon,
    usuarioId,
    tipo,
    Number(outroId),
    outroTipo
);

if (bloqueio) {
    return res.status(403).json({
        erro: "Não é possível enviar mensagens devido a um bloqueio entre as contas."
    });
}

        const mensagem = await poolNeon.query(`
                INSERT INTO mensagens (
                    conversa_id,
                    remetente_tipo,
                    remetente_id,
                    texto
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
                RETURNING id,
                    conversa_id,
                    remetente_tipo,
                    remetente_id,
                    texto,
                    imagem,
                    data_envio
            `, [conversaId, tipo, usuarioId, texto]);


        res.status(201).json(mensagem.rows[0]);


    } catch (error) {

        console.error("Erro ao enviar mensagem:", error);

        return res.status(500).json({
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

        let resultado;

        // ==========================================
        // CLIENTE
        // ==========================================
        if (tipo === "cliente") {
            resultado = await poolNeon.query(`
                    SELECT
                        c.id AS conversa_id,
                        c.artista_id,
                        a.username AS artista_username,
                        perfil.foto_perfil AS outro_usuario_foto,
                        m.texto AS ultima_mensagem,
                        m.data_envio AS ultima_mensagem_data
                    FROM conversas c
                    INNER JOIN Artistas a
                        ON a.id = c.artista_id
                    LEFT JOIN PerfilArtista perfil
                        ON perfil.artista_id = a.id
                    LEFT JOIN LATERAL (
                        SELECT texto, data_envio
                        FROM mensagens
                        WHERE conversa_id = c.id
                        ORDER BY data_envio DESC
                        LIMIT 1
                    ) m ON true
             WHERE c.cliente_id = $1
  AND NOT EXISTS (
      SELECT 1
      FROM artistas_bloqueados b
      WHERE b.usuario_id = $2
        AND b.usuario_tipo = 'cliente'
        AND b.artista_id = c.artista_id
  )
ORDER BY
    m.data_envio DESC,
    c.data_criacao DESC
                `, [usuarioId, usuarioId]);

            return res.json(resultado.rows);
        }

        // ==========================================
        // ARTISTA
        // ==========================================
        if (tipo === "artista") {
            resultado = await poolNeon.query(`
                    SELECT
                        c.id AS conversa_id,

                        CASE
                            WHEN c.cliente_id IS NOT NULL
                                THEN c.cliente_id
                            WHEN c.artista_id = $1
                                THEN c.artista_destino_id
                            ELSE c.artista_id
                        END AS outro_usuario_id,

                        CASE
                            WHEN c.cliente_id IS NOT NULL
                                THEN cliente.username
                            WHEN c.artista_id = $2
                                THEN destino.username
                            ELSE origem.username
                        END AS outro_username,

                        CASE
                            WHEN c.cliente_id IS NOT NULL
                                THEN 'cliente'
                            ELSE 'artista'
                        END AS outro_tipo,

                        CASE
                            WHEN c.cliente_id IS NOT NULL
                                THEN cliente.foto_perfil
                            WHEN c.artista_id = $3
                                THEN perfilDestino.foto_perfil
                            ELSE perfilOrigem.foto_perfil
                        END AS outro_usuario_foto,

                        m.texto AS ultima_mensagem,
                        m.data_envio AS ultima_mensagem_data

                    FROM conversas c

                    LEFT JOIN Artistas origem
                        ON origem.id = c.artista_id

                    LEFT JOIN Artistas destino
                        ON destino.id = c.artista_destino_id

                    LEFT JOIN PerfilArtista perfilOrigem
                        ON perfilOrigem.artista_id = origem.id

                    LEFT JOIN PerfilArtista perfilDestino
                        ON perfilDestino.artista_id = destino.id

                    LEFT JOIN Clientes cliente
                        ON cliente.id = c.cliente_id

                    LEFT JOIN LATERAL (
                        SELECT texto, data_envio
                        FROM mensagens
                        WHERE conversa_id = c.id
                        ORDER BY data_envio DESC
                        LIMIT 1
                    ) m ON true

WHERE
    (
        c.artista_id = $4
        OR c.artista_destino_id = $5
    )
    AND NOT EXISTS (
        SELECT 1
        FROM artistas_bloqueados b
        WHERE
            (
                c.cliente_id IS NULL
                AND b.usuario_tipo = 'artista'
                AND (
                    (
                        b.usuario_id = $6
                        AND b.artista_id = CASE
                            WHEN c.artista_id = $7
                                THEN c.artista_destino_id
                            ELSE c.artista_id
                        END
                    )
                    OR
                    (
                        b.usuario_id = CASE
                            WHEN c.artista_id = $8
                                THEN c.artista_destino_id
                            ELSE c.artista_id
                        END
                        AND b.artista_id = $9
                    )
                )
            )
            OR
            (
                c.cliente_id IS NOT NULL
                AND b.usuario_tipo = 'cliente'
                AND b.usuario_id = c.cliente_id
                AND b.artista_id = $10
            )
    )
ORDER BY
    m.data_envio DESC,
    c.data_criacao DESC

                `, [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId]);

            return res.json(resultado.rows);
        }

        return res.status(403).json({
            erro: "Tipo de usuário inválido"
        });

    } catch (error) {
        console.error("Erro ao listar conversas:", error);

        return res.status(500).json({
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

            const conversaId = Number(req.params.id);
            const usuarioId = req.usuario.id;
            const tipo = req.usuario.tipo;

            if (!Number.isInteger(conversaId) || conversaId <= 0) {
                return res.status(400).json({
                    erro: "ID de conversa inválido"
                });
            }


            const conversa = await poolNeon.query(`
                    SELECT id, artista_id, cliente_id, artista_destino_id
                    FROM conversas
                    WHERE id = $1
                `, [conversaId]);

            if (conversa.rows.length === 0) {
                return res.status(404).json({
                    erro: "Conversa não encontrada."
                });
            }

            const dados = conversa.rows[0];

     
const autorizado =
    (
        tipo === "artista" &&
        (
            Number(dados.artista_id) === Number(usuarioId) ||
            Number(dados.artista_destino_id) === Number(usuarioId)
        )
    ) ||
    (
        tipo === "cliente" &&
        Number(dados.cliente_id) === Number(usuarioId)
    );


            if (!autorizado) {
                return res.status(403).json({
                    erro: "Você não pertence a esta conversa."
                });
            }
const outroId =
    tipo === "cliente"
        ? dados.artista_id
        : dados.cliente_id !== null
            ? dados.cliente_id
            : (
                Number(dados.artista_id) === Number(usuarioId)
                    ? dados.artista_destino_id
                    : dados.artista_id
            );

const outroTipo =
    tipo === "cliente" || dados.cliente_id !== null
        ? (tipo === "cliente" ? "artista" : "cliente")
        : "artista";

const bloqueio = await existeBloqueioEntreUsuarios(
    poolNeon,
    usuarioId,
    tipo,
    Number(outroId),
    outroTipo
);

if (bloqueio) {
    return res.status(403).json({
        erro: "Não é possível enviar mensagens devido a um bloqueio entre as contas."
    });
}
            const resultado = await uploadParaCloudinary(
                req.file.buffer
            );

            const mensagem = await poolNeon.query(`
                    INSERT INTO mensagens (
                        conversa_id,
                        remetente_tipo,
                        remetente_id,
                        imagem
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4
                    )
                    RETURNING id,
                        conversa_id,
                        remetente_tipo,
                        remetente_id,
                        texto,
                        imagem,
                        data_envio
                `, [conversaId, tipo, usuarioId, resultado.secure_url]);

            return res.status(201).json(mensagem.rows[0]);

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


        const resultado = await poolNeon.query(`
SELECT
    c.id,
    c.artista_id,
    c.cliente_id,
    c.artista_destino_id,
    cliente.username AS cliente_username,
    cliente.foto_perfil AS cliente_foto,
    origem.username AS origem_username,
    perfilOrigem.foto_perfil AS origem_foto,
    destino.username AS destino_username,
    perfilDestino.foto_perfil AS destino_foto
FROM conversas c
LEFT JOIN Clientes cliente
    ON cliente.id = c.cliente_id
LEFT JOIN Artistas origem
    ON origem.id = c.artista_id
LEFT JOIN PerfilArtista perfilOrigem
    ON perfilOrigem.artista_id = origem.id
LEFT JOIN Artistas destino
    ON destino.id = c.artista_destino_id
LEFT JOIN PerfilArtista perfilDestino
    ON perfilDestino.artista_id = destino.id
WHERE c.id = $1
            `, [conversaId]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Conversa não encontrada."
            });
        }

        const conversa = resultado.rows[0];

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

const outroId =
    tipo === "cliente"
        ? conversa.artista_id
        : conversa.cliente_id !== null
            ? conversa.cliente_id
            : (
                Number(conversa.artista_id) === usuarioId
                    ? conversa.artista_destino_id
                    : conversa.artista_id
            );

const outroTipo =
    tipo === "cliente" || conversa.cliente_id !== null
        ? (tipo === "cliente" ? "artista" : "cliente")
        : "artista";

const bloqueio = await existeBloqueioEntreUsuarios(
    poolNeon,
    usuarioId,
    tipo,
    Number(outroId),
    outroTipo
);

if (bloqueio) {
    return res.status(403).json({
        erro: "Esta conversa não está disponível devido a um bloqueio."
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