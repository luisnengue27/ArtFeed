const express = require("express");
const router = express.Router();

const { poolNeon } = require("../db");
const verificarToken = require("../middleware/authMiddleware");
const verificarAdmin = require("../middleware/verificarAdmin");
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
// VERIFICAR ADMIN QUANDO NECESSÁRIO
// ==========================================
function verificarAdminSeNecessario(req, res, next) {
    if (req.usuario?.tipo === "admin") {
        return verificarAdmin(req, res, next);
    }

    if (
        req.usuario?.tipo === "artista" ||
        req.usuario?.tipo === "cliente"
    ) {
        return next();
    }

    return res.status(403).json({
        erro: "Tipo de usuário não autorizado."
    });
}

// ==========================================
// VERIFICAR PARTICIPAÇÃO NA CONVERSA
// ==========================================
function pertenceAConversa(dados, usuarioId, tipo) {
    if (tipo === "admin") {
        return Number(dados.administrador_id) === Number(usuarioId);
    }

    if (tipo === "artista") {
        return (
            Number(dados.artista_id) === Number(usuarioId) ||
            Number(dados.artista_destino_id) === Number(usuarioId)
        );
    }

    if (tipo === "cliente") {
        return Number(dados.cliente_id) === Number(usuarioId);
    }

    return false;
}

 // ==========================================
 // BUSCAR USUÁRIOS PARA O ADMINISTRADOR
 // ==========================================
router.get(
    "/admin/usuarios",
    verificarToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const busca = String(req.query.busca || "").trim();
            const pagina = Math.max(1, Number.parseInt(req.query.pagina, 10) || 1);
            const limite = 20;
            const offset = (pagina - 1) * limite;

            const resultado = await poolNeon.query(`
                WITH usuarios AS (
                    SELECT
                        a.id,
                        a.username,
                        'artista' AS tipo,
                        COALESCE(a.foto_perfil, p.foto_perfil) AS foto
                    FROM artistas a
                    LEFT JOIN perfil_artista p
                        ON p.artista_id = a.id
                    WHERE a.ativo = true
                      AND a.username ILIKE $1

                    UNION ALL

                    SELECT
                        c.id,
                        c.username,
                        'cliente' AS tipo,
                        c.foto_perfil AS foto
                    FROM clientes c
                    WHERE c.ativo = true
                      AND c.username ILIKE $1
                )
                SELECT
                    id,
                    username,
                    tipo,
                    foto,
                    COUNT(*) OVER() AS total
                FROM usuarios
                ORDER BY username ASC
                LIMIT $2 OFFSET $3
            `, [`%${busca}%`, limite, offset]);

            const total = resultado.rows.length > 0
                ? Number(resultado.rows[0].total)
                : 0;

            return res.json({
                usuarios: resultado.rows.map(({ total, ...usuario }) => usuario),
                pagina,
                total,
                totalPaginas: Math.ceil(total / limite)
            });

        } catch (error) {
            console.error("Erro ao buscar usuários para o administrador:", error);

            return res.status(500).json({
                erro: "Não foi possível buscar os usuários."
            });
        }
    }
);


// ==========================================
// LISTAR CONVERSAS DO ADMINISTRADOR
// ==========================================
router.get(
    "/admin/conversas",
    verificarToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const administradorId = Number(req.usuario.id);

            const resultado = await poolNeon.query(`
                SELECT
                    c.id AS conversa_id,

                    CASE
                        WHEN c.artista_id IS NOT NULL
                            THEN c.artista_id
                        ELSE c.cliente_id
                    END AS outro_usuario_id,

                    CASE
                        WHEN c.artista_id IS NOT NULL
                            THEN artista.username
                        ELSE cliente.username
                    END AS outro_username,

                    CASE
                        WHEN c.artista_id IS NOT NULL
                            THEN 'artista'
                        ELSE 'cliente'
                    END AS outro_tipo,

                    CASE
                        WHEN c.artista_id IS NOT NULL
                            THEN COALESCE(
                                artista.foto_perfil,
                                perfil.foto_perfil
                            )
                        ELSE cliente.foto_perfil
                    END AS outro_usuario_foto,

                    m.texto AS ultima_mensagem,
                    m.data_envio AS ultima_mensagem_data

                FROM conversas c

                LEFT JOIN artistas artista
                    ON artista.id = c.artista_id

                LEFT JOIN perfil_artista perfil
                    ON perfil.artista_id = artista.id

                LEFT JOIN clientes cliente
                    ON cliente.id = c.cliente_id

                LEFT JOIN LATERAL (
                    SELECT texto, data_envio
                    FROM mensagens
                    WHERE conversa_id = c.id
                    ORDER BY data_envio DESC, id DESC
                    LIMIT 1
                ) m ON true

                WHERE c.administrador_id = $1

                ORDER BY
                    m.data_envio DESC NULLS LAST,
                    c.data_criacao DESC
            `, [administradorId]);

            return res.json(resultado.rows);

        } catch (error) {
            console.error("Erro ao listar conversas administrativas:", error);

            return res.status(500).json({
                erro: "Não foi possível listar as conversas administrativas."
            });
        }
    }
);


// ==========================================
// CRIAR OU ENCONTRAR CONVERSA ADMINISTRATIVA
// ==========================================
router.post(
    "/admin/conversa",
    verificarToken,
    verificarAdmin,
    async (req, res) => {
        try {
            const administradorId = Number(req.usuario.id);
            const usuarioId = Number(req.body.usuario_id);
            const tipoUsuario = req.body.tipo_usuario;

            if (
                !Number.isInteger(usuarioId) ||
                usuarioId <= 0 ||
                !["artista", "cliente"].includes(tipoUsuario)
            ) {
                return res.status(400).json({
                    erro: "Informe um usuário e um tipo válidos."
                });
            }

            // Verificar se o usuário existe e está ativo.
            const tabela = tipoUsuario === "artista"
                ? "artistas"
                : "clientes";

            const usuario = await poolNeon.query(
                `SELECT id FROM ${tabela} WHERE id = $1 AND ativo = true`,
                [usuarioId]
            );

            if (usuario.rows.length === 0) {
                return res.status(404).json({
                    erro: "Usuário não encontrado ou inativo."
                });
            }

            // Procurar uma conversa administrativa já existente.
            const existente = await poolNeon.query(`
                SELECT
                    id,
                    artista_id,
                    cliente_id,
                    artista_destino_id,
                    administrador_id,
                    data_criacao
                FROM conversas
                WHERE administrador_id = $1
                  AND (
                      ($2 = 'artista' AND artista_id = $3)
                      OR
                      ($2 = 'cliente' AND cliente_id = $3)
                  )
                LIMIT 1
            `, [administradorId, tipoUsuario, usuarioId]);

            if (existente.rows.length > 0) {
                return res.json({
                    ...existente.rows[0],
                    existente: true
                });
            }

            // Criar uma nova conversa administrativa.
            const nova = await poolNeon.query(`
                INSERT INTO conversas (
                    artista_id,
                    cliente_id,
                    artista_destino_id,
                    administrador_id
                )
                VALUES ($1, $2, NULL, $3)
                RETURNING
                    id,
                    artista_id,
                    cliente_id,
                    artista_destino_id,
                    administrador_id,
                    data_criacao
            `, [
                tipoUsuario === "artista" ? usuarioId : null,
                tipoUsuario === "cliente" ? usuarioId : null,
                administradorId
            ]);

            return res.status(201).json({
                ...nova.rows[0],
                existente: false
            });

        } catch (error) {
            console.error("Erro ao criar conversa administrativa:", error);

            return res.status(500).json({
                erro: "Não foi possível criar a conversa administrativa."
            });
        }
    }
);

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
                erro: "ID de usuário inválido."
            });
        }

        // ==========================================
        // ARTISTA INICIANDO CONVERSA
        // ==========================================
        if (tipo === "artista") {
            if (
                !artista_id ||
                !Number.isInteger(Number(artista_id)) ||
                Number(artista_id) <= 0
            ) {
                return res.status(400).json({
                    erro: "artista_id é obrigatório."
                });
            }

            // Artista conversando com outro artista
            if (Number(artista_id) !== usuarioId) {
                const bloqueio = await existeBloqueioEntreUsuarios(
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
                    SELECT id, artista_id, cliente_id,
                           artista_destino_id, data_criacao
                    FROM conversas
                    WHERE
                        (artista_id = $1 AND artista_destino_id = $2)
                        OR
                        (artista_id = $3 AND artista_destino_id = $4)
                `, [
                    usuarioId,
                    Number(artista_id),
                    Number(artista_id),
                    usuarioId
                ]);

                if (existente.rows.length > 0) {
                    return res.json(existente.rows[0]);
                }

                const nova = await poolNeon.query(`
                    INSERT INTO conversas (
                        artista_id,
                        artista_destino_id
                    )
                    VALUES ($1, $2)
                    RETURNING id, artista_id, cliente_id,
                              artista_destino_id, data_criacao
                `, [usuarioId, Number(artista_id)]);

                return res.status(201).json(nova.rows[0]);
            }

            // Artista conversando com cliente
            if (
                !cliente_id ||
                !Number.isInteger(Number(cliente_id)) ||
                Number(cliente_id) <= 0
            ) {
                return res.status(400).json({
                    erro: "cliente_id é obrigatório."
                });
            }

            const bloqueio = await existeBloqueioEntreUsuarios(
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
                SELECT id, artista_id, cliente_id,
                       artista_destino_id, data_criacao
                FROM conversas
                WHERE artista_id = $1 AND cliente_id = $2
            `, [usuarioId, Number(cliente_id)]);

            if (existente.rows.length > 0) {
                return res.json(existente.rows[0]);
            }

            const nova = await poolNeon.query(`
                INSERT INTO conversas (artista_id, cliente_id)
                VALUES ($1, $2)
                RETURNING id, artista_id, cliente_id,
                          artista_destino_id, data_criacao
            `, [usuarioId, Number(cliente_id)]);

            return res.status(201).json(nova.rows[0]);
        }

        // ==========================================
        // CLIENTE INICIANDO CONVERSA
        // ==========================================
        if (tipo === "cliente") {
            if (
                !artista_id ||
                !Number.isInteger(Number(artista_id)) ||
                Number(artista_id) <= 0
            ) {
                return res.status(400).json({
                    erro: "artista_id é obrigatório."
                });
            }

            const bloqueio = await existeBloqueioEntreUsuarios(
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
                SELECT id, artista_id, cliente_id,
                       artista_destino_id, data_criacao
                FROM conversas
                WHERE artista_id = $1 AND cliente_id = $2
            `, [Number(artista_id), usuarioId]);

            if (existente.rows.length > 0) {
                return res.json(existente.rows[0]);
            }

            const nova = await poolNeon.query(`
                INSERT INTO conversas (artista_id, cliente_id)
                VALUES ($1, $2)
                RETURNING id, artista_id, cliente_id,
                          artista_destino_id, data_criacao
            `, [Number(artista_id), usuarioId]);

            return res.status(201).json(nova.rows[0]);
        }

        return res.status(403).json({
            erro: "Tipo de usuário inválido."
        });

    } catch (error) {
        console.error("Erro ao criar conversa:", error);

        return res.status(500).json({
            erro: "Erro ao criar conversa."
        });
    }
});

// ==========================================
// BUSCAR MENSAGENS DE UMA CONVERSA
// ==========================================

router.get(
    "/conversa/:id/mensagens",
    verificarToken,
    verificarAdminSeNecessario,
    async (req, res) => {
        try {
            const conversaId = Number(req.params.id);
            const usuarioId = Number(req.usuario.id);
            const tipo = req.usuario.tipo;

            if (!Number.isInteger(conversaId) || conversaId <= 0) {
                return res.status(400).json({
                    erro: "ID de conversa inválido."
                });
            }

            const conversa = await poolNeon.query(
                `
                SELECT
                    id,
                    artista_id,
                    cliente_id,
                    artista_destino_id,
                    administrador_id
                FROM conversas
                WHERE id = $1
                `,
                [conversaId]
            );

            if (conversa.rows.length === 0) {
                return res.status(404).json({
                    erro: "Conversa não encontrada."
                });
            }

            const dados = conversa.rows[0];

            if (!pertenceAConversa(dados, usuarioId, tipo)) {
                return res.status(403).json({
                    erro: "Você não pertence a esta conversa."
                });
            }

            // Bloqueios continuam sendo aplicados
            // nas conversas normais entre artistas e clientes.
            // Conversas administrativas não utilizam esse bloqueio.
            if (dados.administrador_id === null && tipo !== "admin") {
                const outroId =
                    tipo === "cliente"
                        ? dados.artista_id
                        : dados.cliente_id !== null
                            ? dados.cliente_id
                            : (
                                Number(dados.artista_id) === usuarioId
                                    ? dados.artista_destino_id
                                    : dados.artista_id
                            );

                const outroTipo =
                    tipo === "cliente" || dados.cliente_id !== null
                        ? (tipo === "cliente" ? "artista" : "cliente")
                        : "artista";

                const bloqueio = await existeBloqueioEntreUsuarios(
                    usuarioId,
                    tipo,
                    Number(outroId),
                    outroTipo
                );

                if (bloqueio) {
                    return res.status(403).json({
                        erro: "Não é possível acessar esta conversa devido a um bloqueio."
                    });
                }
            }

            const mensagens = await poolNeon.query(
                `
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
                        WHEN m.remetente_tipo = 'admin'
                            THEN adm.username
                    END AS remetente_username,

                    m.texto,
                    m.imagem,
                    m.data_envio

                FROM mensagens m

                LEFT JOIN artistas a
                    ON m.remetente_tipo = 'artista'
                    AND a.id = m.remetente_id

                LEFT JOIN clientes c
                    ON m.remetente_tipo = 'cliente'
                    AND c.id = m.remetente_id

                LEFT JOIN administradores adm
                    ON m.remetente_tipo = 'admin'
                    AND adm.id = m.remetente_id

                WHERE m.conversa_id = $1

                ORDER BY m.data_envio ASC, m.id ASC
                `,
                [conversaId]
            );

            return res.json(mensagens.rows);

        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);

            return res.status(500).json({
                erro: "Erro ao buscar mensagens."
            });
        }
    }
);




// ==========================================
// ENVIAR MENSAGEM DE TEXTO
// ==========================================

router.post(
    "/conversa/:id/mensagens",
    verificarToken,
    verificarAdminSeNecessario,
    async (req, res) => {
        try {
            const conversaId = Number(req.params.id);
            const usuarioId = Number(req.usuario.id);
            const tipo = req.usuario.tipo;
            const { texto } = req.body;

            if (!Number.isInteger(conversaId) || conversaId <= 0) {
                return res.status(400).json({
                    erro: "ID de conversa inválido."
                });
            }

            if (typeof texto !== "string" || !texto.trim()) {
                return res.status(400).json({
                    erro: "A mensagem não pode estar vazia."
                });
            }

            const conversa = await poolNeon.query(
                `
                SELECT
                    id,
                    artista_id,
                    cliente_id,
                    artista_destino_id,
                    administrador_id
                FROM conversas
                WHERE id = $1
                `,
                [conversaId]
            );

            if (conversa.rows.length === 0) {
                return res.status(404).json({
                    erro: "Conversa não encontrada."
                });
            }

            const dados = conversa.rows[0];

            if (!pertenceAConversa(dados, usuarioId, tipo)) {
                return res.status(403).json({
                    erro: "Você não pertence a esta conversa."
                });
            }

            // Verificar bloqueios somente nas conversas normais.
            if (dados.administrador_id === null && tipo !== "admin") {
                const outroId =
                    tipo === "cliente"
                        ? dados.artista_id
                        : dados.cliente_id !== null
                            ? dados.cliente_id
                            : (
                                Number(dados.artista_id) === usuarioId
                                    ? dados.artista_destino_id
                                    : dados.artista_id
                            );

                const outroTipo =
                    tipo === "cliente" || dados.cliente_id !== null
                        ? (tipo === "cliente" ? "artista" : "cliente")
                        : "artista";

                const bloqueio = await existeBloqueioEntreUsuarios(
                    usuarioId,
                    tipo,
                    Number(outroId),
                    outroTipo
                );

                if (bloqueio) {
                    return res.status(403).json({
                        erro: "Não é possível enviar mensagens devido a um bloqueio."
                    });
                }
            }

            const mensagem = await poolNeon.query(
                `
                INSERT INTO mensagens (
                    conversa_id,
                    remetente_tipo,
                    remetente_id,
                    texto
                )
                VALUES ($1, $2, $3, $4)

                RETURNING
                    id,
                    conversa_id,
                    remetente_tipo,
                    remetente_id,
                    texto,
                    imagem,
                    data_envio
                `,
                [conversaId, tipo, usuarioId, texto.trim()]
            );

            return res.status(201).json(mensagem.rows[0]);

        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);

            return res.status(500).json({
                erro: "Erro ao enviar mensagem."
            });
        }
    }
);


// ==========================================
// LISTAR CONVERSAS DO USUÁRIO
// ==========================================

// ==========================================
// LISTAR CONVERSAS DO USUÁRIO
// ==========================================
router.get("/conversas", verificarToken, async (req, res) => {
    try {
        const usuarioId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;

        let resultado;

        // ==========================================
        // CLIENTE
        // ==========================================
        if (tipo === "cliente") {
            resultado = await poolNeon.query(`
                SELECT
                    c.id AS conversa_id,

                    CASE
                        WHEN c.administrador_id IS NOT NULL
                            THEN c.administrador_id
                        ELSE c.artista_id
                    END AS outro_usuario_id,

                    COALESCE(
                        adm.username,
                        a.username
                    ) AS artista_username,

                    COALESCE(
                        adm.username,
                        a.username
                    ) AS outro_username,

                    CASE
                        WHEN c.administrador_id IS NOT NULL
                            THEN 'admin'
                        ELSE 'artista'
                    END AS outro_tipo,

                    CASE
                        WHEN c.administrador_id IS NOT NULL
                            THEN NULL
                        ELSE perfil.foto_perfil
                    END AS outro_usuario_foto,

                    m.texto AS ultima_mensagem,
                    m.data_envio AS ultima_mensagem_data

                FROM conversas c

                LEFT JOIN artistas a
                    ON a.id = c.artista_id

                LEFT JOIN perfil_artista perfil
                    ON perfil.artista_id = a.id

                LEFT JOIN administradores adm
                    ON adm.id = c.administrador_id

                LEFT JOIN LATERAL (
                    SELECT texto, data_envio
                    FROM mensagens
                    WHERE conversa_id = c.id
                    ORDER BY data_envio DESC, id DESC
                    LIMIT 1
                ) m ON true

                WHERE c.cliente_id = $1

                AND (
                    c.administrador_id IS NOT NULL

                    OR NOT EXISTS (
                        SELECT 1
                        FROM artistas_bloqueados b
                        WHERE b.usuario_id = $1
                          AND b.usuario_tipo = 'cliente'
                          AND b.artista_id = c.artista_id
                    )
                )

                ORDER BY
                    m.data_envio DESC NULLS LAST,
                    c.data_criacao DESC
            `, [usuarioId]);

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
                        WHEN c.administrador_id IS NOT NULL
                            THEN c.administrador_id
                        WHEN c.cliente_id IS NOT NULL
                            THEN c.cliente_id
                        WHEN c.artista_id = $1
                            THEN c.artista_destino_id
                        ELSE c.artista_id
                    END AS outro_usuario_id,

                    CASE
                        WHEN c.administrador_id IS NOT NULL
                            THEN adm.username
                        WHEN c.cliente_id IS NOT NULL
                            THEN cliente.username
                        WHEN c.artista_id = $1
                            THEN destino.username
                        ELSE origem.username
                    END AS outro_username,

                    CASE
                        WHEN c.administrador_id IS NOT NULL
                            THEN 'admin'
                        WHEN c.cliente_id IS NOT NULL
                            THEN 'cliente'
                        ELSE 'artista'
                    END AS outro_tipo,

                    CASE
                        WHEN c.administrador_id IS NOT NULL
                            THEN NULL
                        WHEN c.cliente_id IS NOT NULL
                            THEN cliente.foto_perfil
                        WHEN c.artista_id = $1
                            THEN perfilDestino.foto_perfil
                        ELSE perfilOrigem.foto_perfil
                    END AS outro_usuario_foto,

                    m.texto AS ultima_mensagem,
                    m.data_envio AS ultima_mensagem_data

                FROM conversas c

                LEFT JOIN artistas origem
                    ON origem.id = c.artista_id

                LEFT JOIN artistas destino
                    ON destino.id = c.artista_destino_id

                LEFT JOIN perfil_artista perfilOrigem
                    ON perfilOrigem.artista_id = origem.id

                LEFT JOIN perfil_artista perfilDestino
                    ON perfilDestino.artista_id = destino.id

                LEFT JOIN clientes cliente
                    ON cliente.id = c.cliente_id

                LEFT JOIN administradores adm
                    ON adm.id = c.administrador_id

                LEFT JOIN LATERAL (
                    SELECT texto, data_envio
                    FROM mensagens
                    WHERE conversa_id = c.id
                    ORDER BY data_envio DESC, id DESC
                    LIMIT 1
                ) m ON true

                WHERE
                    (
                        (
                            c.administrador_id IS NOT NULL
                            AND c.artista_id = $1
                        )

                        OR

                        (
                            c.administrador_id IS NULL
                            AND (
                                c.artista_id = $1
                                OR c.artista_destino_id = $1
                            )
                        )
                    )

                    AND (
                        c.administrador_id IS NOT NULL

                        OR NOT EXISTS (
                            SELECT 1
                            FROM artistas_bloqueados b
                            WHERE
                                (
                                    c.cliente_id IS NULL
                                    AND b.usuario_tipo = 'artista'
                                    AND (
                                        (
                                            b.usuario_id = $1
                                            AND b.artista_id = CASE
                                                WHEN c.artista_id = $1
                                                    THEN c.artista_destino_id
                                                ELSE c.artista_id
                                            END
                                        )

                                        OR

                                        (
                                            b.usuario_id = CASE
                                                WHEN c.artista_id = $1
                                                    THEN c.artista_destino_id
                                                ELSE c.artista_id
                                            END
                                            AND b.artista_id = $1
                                        )
                                    )
                                )

                                OR

                                (
                                    c.cliente_id IS NOT NULL
                                    AND b.usuario_tipo = 'cliente'
                                    AND b.usuario_id = c.cliente_id
                                    AND b.artista_id = $1
                                )
                        )
                    )

                ORDER BY
                    m.data_envio DESC NULLS LAST,
                    c.data_criacao DESC
            `, [usuarioId]);

            return res.json(resultado.rows);
        }

        return res.status(403).json({
            erro: "Tipo de usuário inválido."
        });

    } catch (error) {
        console.error("Erro ao listar conversas:", error);

        return res.status(500).json({
            erro: "Erro ao listar conversas."
        });
    }
});



router.post(
    "/conversa/:id/imagem",
    verificarToken,
    verificarAdminSeNecessario,
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
    SELECT
        id,
        artista_id,
        cliente_id,
        artista_destino_id,
        administrador_id
    FROM conversas
    WHERE id = $1
`, [conversaId]);

            if (conversa.rows.length === 0) {
                return res.status(404).json({
                    erro: "Conversa não encontrada."
                });
            }

            const dados = conversa.rows[0];

     
if (!pertenceAConversa(dados, usuarioId, tipo)) {
    return res.status(403).json({
        erro: "Você não pertence a esta conversa."
    });
}

if (dados.administrador_id === null && tipo !== "admin") {
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
        usuarioId,
        tipo,
        Number(outroId),
        outroTipo
    );

    if (bloqueio) {
        return res.status(403).json({
            erro: "Não é possível enviar mensagens devido a um bloqueio."
        });
    }
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


router.get(
    "/conversa/:id/detalhes",
    verificarToken,
    verificarAdminSeNecessario,
    async (req, res) => {
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
                    c.administrador_id,

                    cliente.username AS cliente_username,
                    cliente.foto_perfil AS cliente_foto,

                    origem.username AS origem_username,
                    COALESCE(origem.foto_perfil, perfilOrigem.foto_perfil)
                        AS origem_foto,

                    destino.username AS destino_username,
                    COALESCE(destino.foto_perfil, perfilDestino.foto_perfil)
                        AS destino_foto,

                    adm.username AS administrador_username

                FROM conversas c

                LEFT JOIN clientes cliente
                    ON cliente.id = c.cliente_id

                LEFT JOIN artistas origem
                    ON origem.id = c.artista_id

                LEFT JOIN perfil_artista perfilOrigem
                    ON perfilOrigem.artista_id = origem.id

                LEFT JOIN artistas destino
                    ON destino.id = c.artista_destino_id

                LEFT JOIN perfil_artista perfilDestino
                    ON perfilDestino.artista_id = destino.id

                LEFT JOIN administradores adm
                    ON adm.id = c.administrador_id

                WHERE c.id = $1
            `, [conversaId]);

            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    erro: "Conversa não encontrada."
                });
            }

            const conversa = resultado.rows[0];

            if (!pertenceAConversa(conversa, usuarioId, tipo)) {
                return res.status(403).json({
                    erro: "Você não pertence a esta conversa."
                });
            }

            // Conversa administrativa
            if (conversa.administrador_id !== null) {

                if (tipo === "admin") {
                    if (conversa.artista_id !== null) {
                        return res.json({
                            id: conversa.artista_id,
                            tipo: "artista",
                            username: conversa.origem_username,
                            foto: conversa.origem_foto || null
                        });
                    }

                    return res.json({
                        id: conversa.cliente_id,
                        tipo: "cliente",
                        username: conversa.cliente_username,
                        foto: conversa.cliente_foto || "/avatar-padrao.png"
                    });
                }

                return res.json({
                    id: conversa.administrador_id,
                    tipo: "admin",
                    username: conversa.administrador_username,
                    foto: null
                });
            }

            // Conversas normais
            if (tipo !== "admin") {
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
            console.error(
                "Erro ao buscar detalhes da conversa:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível buscar os detalhes da conversa."
            });
        }
    }
);

module.exports = router;