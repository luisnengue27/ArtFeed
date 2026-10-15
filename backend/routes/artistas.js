const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const verificarToken = require("../middleware/authMiddleware");
const { sql, poolPromise } = require("../db");
const { v2: cloudinary } = require("cloudinary");
const authOpcional = require("../middleware/authOpcional");
const router = express.Router();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const uploadParaCloudinary = (buffer, nomeArquivo) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "artfeed",
                public_id: nomeArquivo,
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
// ============================
// CONFIGURAÇÃO DO UPLOAD
// ============================

const upload = multer({
    storage: multer.memoryStorage()
});
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

// Verifica se o e-mail já existe no banco
const artistaExistente = await pool.request()
    .input("email", sql.NVarChar(150), email)
    .query(`
        SELECT id
        FROM Artistas
        WHERE email = @email
    `);

if (artistaExistente.recordset.length > 0) {
    return res.status(409).json({
        erro: "Este e-mail já está cadastrado."
    });
}

        // Criptografa a senha
        const senhaCriptografada = await bcrypt.hash(
            senha,
            10
        );

        // Cadastra o artista no SQL Server
        const resultado = await pool.request()
            .input("username", sql.NVarChar(50), username)
            .input("email", sql.NVarChar(150), email)
            .input("senha", sql.NVarChar(100), senhaCriptografada)
            .query(`
                INSERT INTO Artistas (
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

        const novoArtista = resultado.recordset[0];

        return res.status(201).json({
            mensagem: "Artista cadastrado com sucesso!",
            artista: {
                id: novoArtista.id,
                username: novoArtista.username,
                email: novoArtista.email,
                tipo: "artista"
            }
        });

    } catch (erro) {
        console.error("❌ Erro ao cadastrar artista:", erro);

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

        // Procura o artista no SQL Server
        const resultado = await pool.request()
            .input("email", sql.NVarChar(150), email)
            .query(`
                SELECT
                    id,
                    username,
                    email,
                    senha
                FROM Artistas
                WHERE email = @email
            `);

        if (resultado.recordset.length === 0) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const artista = resultado.recordset[0];

        // Confere a senha
        const senhaCorreta = await bcrypt.compare(
            senha,
            artista.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        // Cria o token
        const token = jwt.sign(
            {
                id: artista.id,
                tipo: "artista"
            },
            process.env.JWT_SECRET || "segredo_artfeed",
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token,
            artista: {
                id: artista.id,
                username: artista.username,
                email: artista.email,
                tipo: "artista"
            }
        });

    } catch (erro) {
        console.error("❌ Erro ao realizar login:", erro);

        return res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

// CRIAR PERFIL
router.post(
    "/perfil",
    verificarToken,
    upload.single("foto"),
    async (req, res) => {
        try {
            const {
                nome,
                preco,
                cidade,
                profissao,
                tags,
                descricao
            } = req.body;

            if (
                !nome ||
                !preco ||
                !cidade ||
                !profissao ||
                !tags ||
                !descricao ||
                !req.file
            ) {
                return res.status(400).json({
                    erro: "Todos os campos são obrigatórios."
                });
            }

            const artistaId = req.usuario.id;

            const pool = await poolPromise;

            const artista = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query(`
                    SELECT id, username, email
                    FROM Artistas
                    WHERE id = @artistaId
                `);

            if (artista.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            const perfilExistente = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query(`
                    SELECT id
                    FROM PerfilArtista
                    WHERE artista_id = @artistaId
                `);

            if (perfilExistente.recordset.length > 0) {
                return res.status(409).json({
                    erro: "Este artista já possui um perfil."
                });
            }
const nomeArquivo = `perfil-${Date.now()}`;

const fotoCloudinary = await uploadParaCloudinary(
    req.file.buffer,
    nomeArquivo
);
            const resultado = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .input("nome", sql.NVarChar(100), nome)
                .input("preco", sql.NVarChar(50), preco)
                .input("cidade", sql.NVarChar(100), cidade)
                .input("profissao", sql.NVarChar(100), profissao)
                .input("tags", sql.NVarChar(500), tags)
                .input("descricao", sql.NVarChar(sql.MAX), descricao)
             .input("foto", sql.NVarChar(500), fotoCloudinary.secure_url)
                .query(`
                    INSERT INTO PerfilArtista (
                        artista_id,
                        nome,
                        preco,
                        cidade,
                        profissao,
                        tags,
                        descricao,
                        foto_perfil
                    )
                    OUTPUT INSERTED.*
                    VALUES (
                        @artistaId,
                        @nome,
                        @preco,
                        @cidade,
                        @profissao,
                        @tags,
                        @descricao,
                        @foto
                    )
                `);

            const perfil = resultado.recordset[0];

            return res.status(201).json({
                mensagem: "Perfil criado com sucesso!",
                perfil: {
                    id: perfil.id,
                    nome: perfil.nome,
                    preco: perfil.preco,
                    cidade: perfil.cidade,
                    profissao: perfil.profissao,
                    tags: perfil.tags
                        .split(",")
                        .map(tag => tag.trim()),
                    descricao: perfil.descricao,
                   foto: perfil.foto_perfil
                }
            });

        } catch (erro) {
            console.error("❌ Erro ao criar perfil:", erro);

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);

// ============================
// PEGAR MEU PERFIL
// ============================

router.get(
    "/perfil",
    verificarToken,
    async (req, res) => {
        try {
            const artistaId = req.usuario.id;

            const pool = await poolPromise;

            const resultado = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query(`
                    SELECT
                        a.id,
                        a.username,
                        a.email,
                        p.id AS perfil_id,
                        p.nome,
                        p.preco,
                        p.cidade,
                        p.profissao,
                        p.tags,
                        p.descricao,
                        p.foto_perfil AS foto
                    FROM Artistas a
                    LEFT JOIN PerfilArtista p
                        ON a.id = p.artista_id
                    WHERE a.id = @artistaId
                `);

            if (resultado.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            const artista = resultado.recordset[0];

            // O artista existe, mas ainda não possui perfil
          if (!artista.perfil_id) {
    return res.status(404).json({
        erro: "Este artista ainda não possui um perfil.",
        username: artista.username,
        email: artista.email
    });
}
            return res.status(200).json({
                username: artista.username,
                email: artista.email,
                nome: artista.nome,
                preco: artista.preco,
                cidade: artista.cidade,
                profissao: artista.profissao,
                tags: artista.tags
                    ? artista.tags.split(",").map(tag => tag.trim())
                    : [],
                descricao: artista.descricao,
           foto: artista.foto || null
            });

        } catch (erro) {
            console.error("❌ Erro ao buscar perfil:", erro);

            return res.status(500).json({
                erro: "Erro ao buscar o perfil do artista."
            });
        }
    }
);

// ============================
// LISTAR TODOS OS PERFIS
// ============================

router.get("/", authOpcional, async (req, res) => {
    try {
        const pool = await poolPromise;

        const usuarioId = req.usuario?.id ?? null;
        const tipoUsuario = req.usuario?.tipo ?? null;

        const resultado = await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipoUsuario", sql.VarChar(20), tipoUsuario)
            .query(`
                SELECT
                    a.id,
                    a.username,
                    p.nome,
                    p.preco,
                    p.cidade,
                    p.profissao,
                    p.tags,
                    p.descricao,
                    p.foto_perfil AS foto,
                    CAST(COALESCE(av.avaliacao, 0) AS DECIMAL(3,1)) AS avaliacao,
                    COALESCE(av.numavaliacao, 0) AS numavaliacao
                FROM Artistas a
                INNER JOIN PerfilArtista p
                    ON a.id = p.artista_id
                LEFT JOIN (
                    SELECT
                        artista_id,
                        AVG(CAST(nota AS DECIMAL(4,2))) AS avaliacao,
                        COUNT(*) AS numavaliacao
                    FROM dbo.Avaliacoes
                    GROUP BY artista_id
                ) av
                    ON av.artista_id = a.id
                WHERE
                    @usuarioId IS NULL
                    OR NOT EXISTS (
                        SELECT 1
                        FROM dbo.ArtistasBloqueados b
                        WHERE b.usuario_id = @usuarioId
                          AND b.usuario_tipo = @tipoUsuario
                          AND b.artista_id = a.id
                    )
            `);

        const perfis = resultado.recordset.map(perfil => ({
            ...perfil,
            foto: perfil.foto || null
        }));

        return res.status(200).json(perfis);

    } catch (erro) {
        console.error("Erro ao buscar perfis:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar os perfis dos artistas."
        });
    }
});

/* ============================
   LISTAR ARTISTAS QUE EU SIGO
============================ */

router.get("/meus-seguidos", verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const tipoUsuario = req.usuario.tipo;

        if (tipoUsuario !== "artista" && tipoUsuario !== "cliente") {
            return res.status(403).json({
                erro: "Tipo de usuário inválido."
            });
        }

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipoUsuario", sql.VarChar(20), tipoUsuario)
            .query(`
                SELECT DISTINCT
                    a.id,
                    a.username,
                    p.nome,
                    p.preco,
                    p.cidade,
                    p.profissao,
                    p.tags,
                    p.descricao,
                    p.foto_perfil AS foto
                FROM Seguidores s
                INNER JOIN Artistas a
                    ON a.id = s.artista_id
                INNER JOIN PerfilArtista p
                    ON p.artista_id = a.id
                WHERE
                    (
                        (
                            @tipoUsuario = 'cliente'
                            AND s.cliente_id = @usuarioId
                        )
                        OR
                        (
                            @tipoUsuario = 'artista'
                            AND s.artista_seguidor_id = @usuarioId
                        )
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM dbo.ArtistasBloqueados b
                        WHERE b.usuario_id = @usuarioId
                          AND b.usuario_tipo = @tipoUsuario
                          AND b.artista_id = a.id
                    )
                ORDER BY a.username
            `);

        return res.status(200).json(resultado.recordset);

    } catch (erro) {
        console.error("Erro ao listar artistas seguidos:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar artistas seguidos."
        });
    }
});
// ===============================
// PESQUISAR ARTISTAS
// ===============================


router.get("/buscar", authOpcional, async (req, res) => {
    try {
        const { termo } = req.query;

        if (!termo || !termo.trim()) {
            return res.status(400).json({
                erro: "Digite algo para pesquisar."
            });
        }

        const pool = await poolPromise;

        const usuarioId = req.usuario?.id ?? null;
        const tipoUsuario = req.usuario?.tipo ?? null;

        const resultado = await pool.request()
            .input("termo", sql.NVarChar(100), `%${termo.trim()}%`)
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipoUsuario", sql.VarChar(20), tipoUsuario)
            .query(`
                SELECT
                    a.id,
                    a.username,
                    p.nome,
                    p.preco,
                    p.cidade,
                    p.profissao,
                    p.tags,
                    p.descricao,
                    p.foto_perfil AS foto,
                    CAST(COALESCE(av.avaliacao, 0) AS DECIMAL(3,1)) AS avaliacao,
                    COALESCE(av.numavaliacao, 0) AS numavaliacao
                FROM Artistas a
                INNER JOIN PerfilArtista p
                    ON a.id = p.artista_id
                LEFT JOIN (
                    SELECT
                        artista_id,
                        AVG(CAST(nota AS DECIMAL(4,2))) AS avaliacao,
                        COUNT(*) AS numavaliacao
                    FROM dbo.Avaliacoes
                    GROUP BY artista_id
                ) av
                    ON av.artista_id = a.id
                WHERE (
                    a.username LIKE @termo
                    OR p.nome LIKE @termo
                    OR p.profissao LIKE @termo
                    OR p.cidade LIKE @termo
                    OR p.tags LIKE @termo
                )
                AND (
                    @usuarioId IS NULL
                    OR NOT EXISTS (
                        SELECT 1
                        FROM dbo.ArtistasBloqueados b
                        WHERE b.usuario_id = @usuarioId
                          AND b.usuario_tipo = @tipoUsuario
                          AND b.artista_id = a.id
                    )
                )
            `);

        return res.status(200).json(resultado.recordset);

    } catch (erro) {
        console.error("Erro ao pesquisar artistas:", erro);

        return res.status(500).json({
            erro: "Erro ao pesquisar artistas."
        });
    }
});


router.delete("/artes/:arteId", verificarToken, async (req, res) => {
    try {
        const artistaId = req.usuario.id;
        const arteId = parseInt(req.params.arteId);

        if (isNaN(arteId)) {
            return res.status(400).json({
                erro: "ID da arte inválido."
            });
        }

        const pool = await poolPromise;

        const verificarArte = await pool.request()
            .input("arteId", sql.Int, arteId)
            .input("artistaId", sql.Int, artistaId)
            .query(`
                SELECT id, imagem
                FROM Artes
                WHERE id = @arteId
                AND artista_id = @artistaId
            `);

        if (verificarArte.recordset.length === 0) {
            return res.status(404).json({
                erro: "Arte não encontrada."
            });
        }

        const imagem = verificarArte.recordset[0].imagem;

        await pool.request()
            .input("arteId", sql.Int, arteId)
            .query(`
                DELETE FROM Artes
                WHERE id = @arteId
            `);

       

        return res.status(200).json({
            mensagem: "Arte excluída com sucesso."
        });

    } catch (error) {
        console.error("Erro ao excluir arte:", error);

        return res.status(500).json({
            erro: "Erro ao excluir arte."
        });
    }
});
// ============================
// SEGUIR ARTISTA
// ============================

router.post(
    "/:artistaId/seguir",
    verificarToken,
    async (req, res) => {

        try {

            const artistaId = Number(req.params.artistaId);
            const usuarioId = req.usuario.id;
            const tipoUsuario = req.usuario.tipo;

            if (isNaN(artistaId)) {
                return res.status(400).json({
                    erro: "ID do artista inválido."
                });
            }

            const pool = await poolPromise;

            // Verifica se o artista que será seguido existe
            const artista = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query(`
                    SELECT id
                    FROM Artistas
                    WHERE id = @artistaId
                `);

            if (artista.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            // ==================================
            // ARTISTA SEGUINDO OUTRO ARTISTA
            // ==================================

            if (tipoUsuario === "artista") {

                // Impede seguir a si mesmo
                if (usuarioId === artistaId) {
                    return res.status(400).json({
                        erro: "Você não pode seguir a si mesmo."
                    });
                }

                // Verifica se já segue
                const jaSegue = await pool.request()
                    .input("artistaSeguidorId", sql.Int, usuarioId)
                    .input("artistaId", sql.Int, artistaId)
                    .query(`
                        SELECT id
                        FROM Seguidores
                        WHERE artista_seguidor_id = @artistaSeguidorId
                        AND artista_id = @artistaId
                    `);

                if (jaSegue.recordset.length > 0) {
                    return res.status(409).json({
                        erro: "Você já segue este artista."
                    });
                }

                // Cria o relacionamento
                await pool.request()
                    .input("artistaSeguidorId", sql.Int, usuarioId)
                    .input("artistaId", sql.Int, artistaId)
                    .query(`
                        INSERT INTO Seguidores (
                            artista_seguidor_id,
                            artista_id
                        )
                        VALUES (
                            @artistaSeguidorId,
                            @artistaId
                        )
                    `);

                return res.status(201).json({
                    mensagem: "Artista seguido com sucesso!"
                });
            }

            // ==================================
            // CLIENTE SEGUINDO ARTISTA
            // ==================================

            if (tipoUsuario === "cliente") {

                const jaSegue = await pool.request()
                    .input("clienteId", sql.Int, usuarioId)
                    .input("artistaId", sql.Int, artistaId)
                    .query(`
                        SELECT id
                        FROM Seguidores
                        WHERE cliente_id = @clienteId
                        AND artista_id = @artistaId
                    `);

                if (jaSegue.recordset.length > 0) {
                    return res.status(409).json({
                        erro: "Você já segue este artista."
                    });
                }

                await pool.request()
                    .input("clienteId", sql.Int, usuarioId)
                    .input("artistaId", sql.Int, artistaId)
                    .query(`
                        INSERT INTO Seguidores (
                            cliente_id,
                            artista_id
                        )
                        VALUES (
                            @clienteId,
                            @artistaId
                        )
                    `);

                return res.status(201).json({
                    mensagem: "Artista seguido com sucesso!"
                });
            }

            return res.status(403).json({
                erro: "Tipo de usuário não autorizado."
            });

        } catch (erro) {

            console.error(
                "❌ Erro ao seguir artista:",
                erro
            );

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);

 // ============================
 // AVALIAR ARTISTA
 // ============================


router.post("/:artistaId/avaliar", verificarToken, async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);
        const avaliadorId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;
        const nota = Number(req.body.nota);

        if (!Number.isSafeInteger(artistaId) || artistaId <= 0) {
            return res.status(400).json({
                erro: "ID do artista inválido."
            });
        }

        if (
            !Number.isSafeInteger(avaliadorId) ||
            avaliadorId <= 0 ||
            !["artista", "cliente"].includes(tipo)
        ) {
            return res.status(403).json({
                erro: "Usuário não autorizado."
            });
        }

        if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
            return res.status(400).json({
                erro: "A nota deve ser um número inteiro de 1 a 5."
            });
        }

        if (tipo === "artista" && avaliadorId === artistaId) {
            return res.status(400).json({
                erro: "Você não pode avaliar a si mesmo."
            });
        }

        const pool = await poolPromise;

        const artista = await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .query(`
                SELECT id
                FROM Artistas
                WHERE id = @artistaId
            `);

        if (artista.recordset.length === 0) {
            return res.status(404).json({
                erro: "Artista não encontrado."
            });
        }

        const clienteId = tipo === "cliente" ? avaliadorId : null;
        const artistaAvaliadorId =
            tipo === "artista" ? avaliadorId : null;

        const existente = await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .input("clienteId", sql.Int, clienteId)
            .input("artistaAvaliadorId", sql.Int, artistaAvaliadorId)
            .query(`
                SELECT id
                FROM dbo.Avaliacoes
                WHERE artista_id = @artistaId
                  AND (
                    (@clienteId IS NOT NULL
                     AND cliente_id = @clienteId)
                    OR
                    (@artistaAvaliadorId IS NOT NULL
                     AND artista_avaliador_id = @artistaAvaliadorId)
                  )
            `);

        if (existente.recordset.length > 0) {
            return res.status(409).json({
                erro: "Você já avaliou este artista."
            });
        }

        await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .input("clienteId", sql.Int, clienteId)
            .input("artistaAvaliadorId", sql.Int, artistaAvaliadorId)
            .input("nota", sql.Decimal(4, 2), nota)
            .input("comentario", sql.NVarChar(sql.MAX), null)
            .query(`
                INSERT INTO dbo.Avaliacoes (
                    cliente_id,
                    artista_id,
                    nota,
                    comentario,
                    data_avaliacao,
                    artista_avaliador_id
                )
                VALUES (
                    @clienteId,
                    @artistaId,
                    @nota,
                    @comentario,
                    SYSDATETIME(),
                    @artistaAvaliadorId
                )
            `);

        const resultado = await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .query(`
                SELECT
                    CAST(AVG(nota) AS DECIMAL(3,1)) AS avaliacao,
                    COUNT(*) AS numavaliacao
                FROM dbo.Avaliacoes
                WHERE artista_id = @artistaId
            `);

        return res.status(201).json({
            mensagem: "Avaliação registrada com sucesso!",
            avaliacao: resultado.recordset[0].avaliacao,
            numavaliacao: resultado.recordset[0].numavaliacao
        });

    } catch (erro) {
        console.error("Erro ao avaliar artista:", erro);

        return res.status(500).json({
            erro: "Erro ao registrar avaliação."
        });
    }
});

router.post("/:artistaId/avaliar", verificarToken, async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);
        const avaliadorId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;
        const nota = Number(req.body.nota);
        const comentario = req.body.comentario ?? null;

        if (!Number.isSafeInteger(artistaId) || artistaId <= 0) {
            return res.status(400).json({
                erro: "ID do artista inválido."
            });
        }

        if (
            !Number.isSafeInteger(avaliadorId) ||
            avaliadorId <= 0 ||
            !["artista", "cliente"].includes(tipo)
        ) {
            return res.status(403).json({
                erro: "Usuário não autorizado."
            });
        }

        if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
            return res.status(400).json({
                erro: "A nota deve ser um número inteiro de 1 a 5."
            });
        }

        if (tipo === "artista" && avaliadorId === artistaId) {
            return res.status(400).json({
                erro: "Você não pode avaliar a si mesmo."
            });
        }

        const pool = await poolPromise;

        const artista = await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .query(`
                SELECT id
                FROM Artistas
                WHERE id = @artistaId
            `);

        if (artista.recordset.length === 0) {
            return res.status(404).json({
                erro: "Artista não encontrado."
            });
        }

        const clienteId = tipo === "cliente" ? avaliadorId : null;
        const artistaAvaliadorId =
            tipo === "artista" ? avaliadorId : null;

        const existente = await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .input("clienteId", sql.Int, clienteId)
            .input("artistaAvaliadorId", sql.Int, artistaAvaliadorId)
            .query(`
                SELECT id
                FROM dbo.Avaliacoes
                WHERE artista_id = @artistaId
                  AND (
                    (@clienteId IS NOT NULL
                     AND cliente_id = @clienteId)
                    OR
                    (@artistaAvaliadorId IS NOT NULL
                     AND artista_avaliador_id = @artistaAvaliadorId)
                  )
            `);

        if (existente.recordset.length > 0) {
            return res.status(409).json({
                erro: "Você já avaliou este artista."
            });
        }

        await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .input("clienteId", sql.Int, clienteId)
            .input("artistaAvaliadorId", sql.Int, artistaAvaliadorId)
            .input("nota", sql.Decimal(4, 2), nota)
            .input("comentario", sql.NVarChar(sql.MAX), comentario)
            .query(`
                INSERT INTO dbo.Avaliacoes (
                    cliente_id,
                    artista_id,
                    nota,
                    comentario,
                    data_avaliacao,
                    artista_avaliador_id
                )
                VALUES (
                    @clienteId,
                    @artistaId,
                    @nota,
                    @comentario,
                    SYSDATETIME(),
                    @artistaAvaliadorId
                )
            `);

        const resultado = await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .query(`
                SELECT
                    CAST(AVG(nota) AS DECIMAL(3,1)) AS avaliacao,
                    COUNT(*) AS numavaliacao
                FROM dbo.Avaliacoes
                WHERE artista_id = @artistaId
            `);

        return res.status(201).json({
            mensagem: "Avaliação registrada com sucesso!",
            avaliacao: resultado.recordset[0].avaliacao,
            numavaliacao: resultado.recordset[0].numavaliacao
        });

    } catch (erro) {
        console.error("Erro ao avaliar artista:", erro);

        return res.status(500).json({
            erro: "Erro ao registrar avaliação."
        });
    }
});

// ============================
// DEIXAR DE SEGUIR ARTISTA
// ============================

router.delete(
    "/:artistaId/seguir",
    verificarToken,
    async (req, res) => {

        try {

            const artistaId = Number(req.params.artistaId);
            const usuarioId = req.usuario.id;
            const tipoUsuario = req.usuario.tipo;

            if (isNaN(artistaId)) {
                return res.status(400).json({
                    erro: "ID do artista inválido."
                });
            }

            const pool = await poolPromise;

            // ============================
            // ARTISTA
            // ============================

            if (tipoUsuario === "artista") {

                const resultado = await pool.request()
                    .input("artistaSeguidorId", sql.Int, usuarioId)
                    .input("artistaId", sql.Int, artistaId)
                    .query(`
                        DELETE FROM Seguidores
                        WHERE artista_seguidor_id = @artistaSeguidorId
                        AND artista_id = @artistaId
                    `);

                if (resultado.rowsAffected[0] === 0) {
                    return res.status(404).json({
                        erro: "Você não segue este artista."
                    });
                }

                return res.status(200).json({
                    mensagem: "Você deixou de seguir o artista."
                });
            }

            // ============================
            // CLIENTE
            // ============================

            if (tipoUsuario === "cliente") {

                const resultado = await pool.request()
                    .input("clienteId", sql.Int, usuarioId)
                    .input("artistaId", sql.Int, artistaId)
                    .query(`
                        DELETE FROM Seguidores
                        WHERE cliente_id = @clienteId
                        AND artista_id = @artistaId
                    `);

                if (resultado.rowsAffected[0] === 0) {
                    return res.status(404).json({
                        erro: "Você não segue este artista."
                    });
                }

                return res.status(200).json({
                    mensagem: "Você deixou de seguir o artista."
                });
            }

            return res.status(403).json({
                erro: "Tipo de usuário não autorizado."
            });

        } catch (erro) {

            console.error(
                "❌ Erro ao deixar de seguir artista:",
                erro
            );

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);
// ============================
// CONTAR SEGUIDORES
// ============================

router.get(
    "/:artistaId/seguidores",
    async (req, res) => {

        try {

            const artistaId = Number(req.params.artistaId);

            const pool = await poolPromise;

            // Verifica se o artista existe
            const artista = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query(`
                    SELECT id
                    FROM Artistas
                    WHERE id = @artistaId
                `);

            if (artista.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            // Conta quantos clientes seguem o artista
            const resultado = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query(`
                    SELECT COUNT(*) AS seguidores
                    FROM Seguidores
                    WHERE artista_id = @artistaId
                `);

            return res.status(200).json({
                seguidores: resultado.recordset[0].seguidores
            });

        } catch (erro) {

            console.error(
                "❌ Erro ao contar seguidores:",
                erro
            );

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);
// ============================
// VERIFICAR SE ESTÁ SEGUINDO
// ============================

router.get(
    "/:artistaId/seguindo",
    verificarToken,
    async (req, res) => {

        try {

            const artistaId = Number(req.params.artistaId);
            const usuarioId = req.usuario.id;
            const tipoUsuario = req.usuario.tipo;

            if (isNaN(artistaId)) {
                return res.status(400).json({
                    erro: "ID do artista inválido."
                });
            }

            const pool = await poolPromise;

            // Verifica se o artista existe
            const artista = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query(`
                    SELECT id
                    FROM Artistas
                    WHERE id = @artistaId
                `);

            if (artista.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            let resultado;

            // ============================
            // ARTISTA
            // ============================

            if (tipoUsuario === "artista") {

                resultado = await pool.request()
                    .input(
                        "artistaSeguidorId",
                        sql.Int,
                        usuarioId
                    )
                    .input(
                        "artistaId",
                        sql.Int,
                        artistaId
                    )
                    .query(`
                        SELECT id
                        FROM Seguidores
                        WHERE artista_seguidor_id = @artistaSeguidorId
                        AND artista_id = @artistaId
                    `);
            }

            // ============================
            // CLIENTE
            // ============================

            else if (tipoUsuario === "cliente") {

                resultado = await pool.request()
                    .input(
                        "clienteId",
                        sql.Int,
                        usuarioId
                    )
                    .input(
                        "artistaId",
                        sql.Int,
                        artistaId
                    )
                    .query(`
                        SELECT id
                        FROM Seguidores
                        WHERE cliente_id = @clienteId
                        AND artista_id = @artistaId
                    `);
            }

            else {
                return res.status(403).json({
                    erro: "Tipo de usuário não autorizado."
                });
            }

            return res.status(200).json({
                seguindo: resultado.recordset.length > 0
            });

        } catch (erro) {

            console.error(
                "❌ Erro ao verificar se está seguindo:",
                erro
            );

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);
// EDITAR PERFIL
router.put(
    "/perfil",
    verificarToken,
    upload.single("foto"),
    async (req, res) => {

        try {
            const {
                username,
                email,
                senha,
                nome,
                preco,
                cidade,
                profissao,
                tags,
                descricao
            } = req.body;

            const artistaId = req.usuario.id;

            const pool = await poolPromise;

            // Verifica se o artista existe
            const artistaResultado = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query(`
                    SELECT id, username, email, senha
                    FROM Artistas
                    WHERE id = @artistaId
                `);

            if (artistaResultado.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            const artista = artistaResultado.recordset[0];

            // Verifica se o novo e-mail já pertence a outro artista
            if (email && email !== artista.email) {
                const emailExistente = await pool.request()
                    .input("email", sql.NVarChar(150), email)
                    .input("artistaId", sql.Int, artistaId)
                    .query(`
                        SELECT id
                        FROM Artistas
                        WHERE email = @email
                        AND id <> @artistaId
                    `);

                if (emailExistente.recordset.length > 0) {
                    return res.status(409).json({
                        erro: "Este e-mail já está cadastrado."
                    });
                }
            }

            // Verifica se o novo username já pertence a outro artista
            if (username && username !== artista.username) {
                const usernameExistente = await pool.request()
                    .input("username", sql.NVarChar(50), username)
                    .input("artistaId", sql.Int, artistaId)
                    .query(`
                        SELECT id
                        FROM Artistas
                        WHERE username = @username
                        AND id <> @artistaId
                    `);

                if (usernameExistente.recordset.length > 0) {
                    return res.status(409).json({
                        erro: "Este username já está cadastrado."
                    });
                }
            }

            // Atualiza username e e-mail
            await pool.request()
                .input(
                    "artistaId",
                    sql.Int,
                    artistaId
                )
                .input(
                    "username",
                    sql.NVarChar(50),
                    username || artista.username
                )
                .input(
                    "email",
                    sql.NVarChar(150),
                    email || artista.email
                )
                .query(`
                    UPDATE Artistas
                    SET
                        username = @username,
                        email = @email
                    WHERE id = @artistaId
                `);

            // Atualiza senha somente se o usuário informou uma nova senha
            if (senha) {
                const senhaCriptografada =
                    await bcrypt.hash(senha, 10);

                await pool.request()
                    .input(
                        "artistaId",
                        sql.Int,
                        artistaId
                    )
                    .input(
                        "senha",
                        sql.NVarChar(100),
                        senhaCriptografada
                    )
                    .query(`
                        UPDATE Artistas
                        SET senha = @senha
                        WHERE id = @artistaId
                    `);
            }

            // Atualiza os dados do PerfilArtista
        const requestPerfil = pool.request()
    .input("artistaId", sql.Int, artistaId)
    .input("nome", sql.NVarChar(100), nome)
    .input("preco", sql.NVarChar(50), preco)
    .input("cidade", sql.NVarChar(100), cidade)
    .input("profissao", sql.NVarChar(100), profissao)
    .input("tags", sql.NVarChar(500), tags)
    .input("descricao", sql.NVarChar(sql.MAX), descricao);

let queryPerfil = `
    UPDATE PerfilArtista
    SET
        nome = @nome,
        preco = @preco,
        cidade = @cidade,
        profissao = @profissao,
        tags = @tags,
        descricao = @descricao
`;

if (req.file) {
    const nomeArquivo = `perfil-${artistaId}-${Date.now()}`;

    const fotoCloudinary = await uploadParaCloudinary(
        req.file.buffer,
        nomeArquivo
    );

    requestPerfil.input(
        "foto",
        sql.NVarChar(500),
        fotoCloudinary.secure_url
    );

    queryPerfil += `,
        foto_perfil = @foto
    `;
}

queryPerfil += `
    WHERE artista_id = @artistaId
`;

await requestPerfil.query(queryPerfil);

            return res.status(200).json({
                mensagem: "Perfil atualizado com sucesso!"
            });

        } catch (erro) {
            console.error(
                "❌ Erro ao atualizar perfil:",
                erro
            );

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);
// ===============================
// ARTES DO PORTFÓLIO
// ===============================

// POST - cadastrar uma nova arte
router.post(
    "/artes",
    verificarToken,
    upload.single("imagem"),
    async (req, res) => {
        try {
            const artistaId = req.usuario.id;

            const { titulo } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    erro: "A imagem da arte é obrigatória"
                });
            }

            const pool = await poolPromise;

            // Confirma se o artista existe
            const artista = await pool.request()
                .input("id", sql.Int, artistaId)
                .query(`
                    SELECT id
                    FROM Artistas
                    WHERE id = @id
                `);

            if (artista.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Artista não encontrado"
                });
            }
const nomeArquivo = `artista-${Date.now()}`;

const imagemCloudinary = await uploadParaCloudinary(
    req.file.buffer,
    nomeArquivo
);
            const resultado = await pool.request()
                .input("artista_id", sql.Int, artistaId)
                .input("titulo", sql.NVarChar(150), titulo || null)
              .input("imagem", sql.NVarChar(500), imagemCloudinary.secure_url)
                .query(`
                    INSERT INTO Artes
                        (artista_id, titulo, imagem)
                    OUTPUT
                        INSERTED.id,
                        INSERTED.artista_id,
                        INSERTED.titulo,
                        INSERTED.imagem,
                        INSERTED.data_publicacao
                    VALUES
                        (@artista_id, @titulo, @imagem)
                `);

            res.status(201).json({
                mensagem: "Arte adicionada com sucesso",
                arte: resultado.recordset[0]
            });

        } catch (error) {
            console.error("Erro ao cadastrar arte:", error);

            res.status(500).json({
                erro: "Erro ao cadastrar arte"
            });
        }
    }
);
// ===============================
// ARTES DO ARTISTA LOGADO
// ===============================

router.get("/minhas-artes", verificarToken, async (req, res) => {
    try {
        const artistaId = req.usuario.id;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("artista_id", sql.Int, artistaId)
            .query(`
                SELECT
                    id,
                    artista_id,
                    titulo,
                    imagem,
                    data_publicacao
                FROM Artes
                WHERE artista_id = @artista_id
                ORDER BY data_publicacao DESC
            `);

      const artes = resultado.recordset.map(arte => ({
    ...arte,
    imagem: arte.imagem
}));

        return res.status(200).json(artes);

    } catch (error) {
        console.error("Erro ao buscar minhas artes:", error);

        return res.status(500).json({
            erro: "Erro ao buscar suas artes."
        });
    }
});
// GET - listar todas as artes

router.get("/artes", authOpcional, async (req, res) => {
    try {
        const pool = await poolPromise;

        const usuarioId = req.usuario?.id ?? null;
        const tipoUsuario = req.usuario?.tipo ?? null;

        const resultado = await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipoUsuario", sql.VarChar(20), tipoUsuario)
            .query(`
                SELECT
                    Artes.id,
                    Artes.artista_id,
                    Artes.titulo,
                    Artes.imagem,
                    Artes.data_publicacao,
                    Artistas.username
                FROM Artes
                INNER JOIN Artistas
                    ON Artes.artista_id = Artistas.id
                WHERE
                    @usuarioId IS NULL
                    OR NOT EXISTS (
                        SELECT 1
                        FROM dbo.ArtistasBloqueados b
                        WHERE b.usuario_id = @usuarioId
                          AND b.usuario_tipo = @tipoUsuario
                          AND b.artista_id = Artes.artista_id
                    )
                ORDER BY Artes.data_publicacao DESC
            `);

        return res.json(resultado.recordset);

    } catch (erro) {
        console.error("Erro ao buscar artes:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar artes."
        });
    }
});

// ===============================
// PORTFÓLIO PÚBLICO DO ARTISTA
// ===============================

router.get(
    "/portfolio/:artistaId",
    verificarToken,
    async (req, res) => {
    try {
        const artistaId = parseInt(req.params.artistaId);

        if (isNaN(artistaId)) {
            return res.status(400).json({
                erro: "ID do artista inválido"
            });
        }

        const pool = await poolPromise;

        const usuarioId = req.usuario.id;
        const tipoUsuario = req.usuario.tipo;

        if (tipoUsuario !== "artista" && tipoUsuario !== "cliente") {
            return res.status(403).json({
                erro: "Tipo de usuário inválido."
            });
        }

        const bloqueio = await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipoUsuario", sql.VarChar(20), tipoUsuario)
            .input("artistaId", sql.Int, artistaId)
            .query(`
                SELECT TOP 1 id
                FROM dbo.ArtistasBloqueados
                WHERE usuario_id = @usuarioId
                  AND usuario_tipo = @tipoUsuario
                  AND artista_id = @artistaId
            `);

        if (bloqueio.recordset.length > 0) {
            return res.status(404).json({
                erro: "Este portfólio não está disponível."
            });
        }

        // Primeiro verifica se o artista existe
        const artistaBase = await pool.request()
            .input("artista_id", sql.Int, artistaId)
            .query(`
                SELECT
                    id,
                    username,
                    email
                FROM Artistas
                WHERE id = @artista_id
            `);

        // Artista realmente não existe
        if (artistaBase.recordset.length === 0) {
            return res.status(404).json({
                erro: "Artista não encontrado"
            });
        }

        // Agora busca o perfil do artista
        const artistaResult = await pool.request()
            .input("artista_id", sql.Int, artistaId)
            .query(`
                SELECT
                    Artistas.id,
                    Artistas.username,
                    Artistas.email,
                    PerfilArtista.nome,
                    PerfilArtista.preco,
                    PerfilArtista.cidade,
                    PerfilArtista.profissao,
                    PerfilArtista.tags,
                    PerfilArtista.descricao,
                    PerfilArtista.foto_perfil
                FROM Artistas
                LEFT JOIN PerfilArtista
                    ON Artistas.id = PerfilArtista.artista_id
                WHERE Artistas.id = @artista_id
            `);

        const artista = artistaResult.recordset[0];

        // Artista existe, mas ainda não possui perfil
        if (!artista.nome) {
            return res.status(404).json({
                erro: "Este artista ainda não possui um perfil."
            });
        }

        // Busca as artes do portfólio
        const artesResult = await pool.request()
            .input("artista_id", sql.Int, artistaId)
            .query(`
                SELECT
                    id,
                    artista_id,
                    titulo,
                    imagem,
                    data_publicacao
                FROM Artes
                WHERE artista_id = @artista_id
                ORDER BY data_publicacao DESC
            `);

       // URL da foto de perfil
if (artista.foto_perfil) {
    artista.foto_perfil = artista.foto_perfil;
}

// URLs das artes
const artes = artesResult.recordset.map(arte => ({
    ...arte,
    imagem: arte.imagem
}));

        return res.json({
            artista,
            artes
        });

    } catch (error) {
        console.error("Erro ao buscar portfólio:", error);

        return res.status(500).json({
            erro: "Erro ao buscar portfólio"
        });
    }
});

//
//    coiso do carrossel
//

router.get("/artes-carrossel", authOpcional, async (req, res) => {
    try {
        const pool = await poolPromise;

        const usuarioId = req.usuario?.id ?? null;
        const tipoUsuario = req.usuario?.tipo ?? null;

        const resultado = await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipoUsuario", sql.VarChar(20), tipoUsuario)
            .query(`
                SELECT
                    Artes.id,
                    Artes.titulo,
                    Artes.imagem,
                    Artes.artista_id,
                    PerfilArtista.nome AS artista_nome
                FROM Artes
                INNER JOIN PerfilArtista
                    ON Artes.artista_id = PerfilArtista.artista_id
                WHERE
                    @usuarioId IS NULL
                    OR NOT EXISTS (
                        SELECT 1
                        FROM dbo.ArtistasBloqueados b
                        WHERE b.usuario_id = @usuarioId
                          AND b.usuario_tipo = @tipoUsuario
                          AND b.artista_id = Artes.artista_id
                    )
                ORDER BY Artes.data_publicacao DESC
            `);

        return res.json(resultado.recordset);

    } catch (erro) {
        console.error("Erro ao buscar artes do carrossel:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar artes."
        });
    }
});

/* =========================================
   BLOQUEAR ARTISTA
========================================= */

router.post("/:artistaId/bloquear", verificarToken, async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);
        const usuarioId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;

        if (
            !Number.isSafeInteger(artistaId) || artistaId <= 0 ||
            !Number.isSafeInteger(usuarioId) || usuarioId <= 0
        ) {
            return res.status(400).json({ erro: "ID inválido." });
        }

        if (!["artista", "cliente"].includes(tipo)) {
            return res.status(403).json({ erro: "Usuário não autorizado." });
        }

        if (tipo === "artista" && usuarioId === artistaId) {
            return res.status(400).json({
                erro: "Você não pode bloquear a própria conta."
            });
        }

        const pool = await poolPromise;

        const artista = await pool.request()
            .input("artistaId", sql.Int, artistaId)
            .query("SELECT id FROM Artistas WHERE id = @artistaId");

        if (artista.recordset.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado." });
        }

        const existente = await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipo", sql.VarChar(20), tipo)
            .input("artistaId", sql.Int, artistaId)
            .query(`
                SELECT id
                FROM dbo.ArtistasBloqueados
                WHERE usuario_id = @usuarioId
                  AND usuario_tipo = @tipo
                  AND artista_id = @artistaId
            `);

        if (existente.recordset.length > 0) {
            return res.status(409).json({
                erro: "Você já bloqueou este artista."
            });
        }

        await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipo", sql.VarChar(20), tipo)
            .input("artistaId", sql.Int, artistaId)
            .query(`
                INSERT INTO dbo.ArtistasBloqueados
                    (usuario_id, usuario_tipo, artista_id)
                VALUES
                    (@usuarioId, @tipo, @artistaId)
            `);

        return res.status(201).json({
            mensagem: "Artista bloqueado com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao bloquear artista:", erro);
        return res.status(500).json({
            erro: "Erro ao bloquear artista."
        });
    }
});


/* =========================================
   LISTAR CONTAS BLOQUEADAS
========================================= */

router.get("/bloqueados", verificarToken, async (req, res) => {
    try {
        const usuarioId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;

        if (!["artista", "cliente"].includes(tipo)) {
            return res.status(403).json({ erro: "Usuário não autorizado." });
        }

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipo", sql.VarChar(20), tipo)
            .query(`
                SELECT
                    a.id,
                    a.username,
                    p.nome,
                    p.foto_perfil AS foto,
                    p.profissao,
                    p.cidade,
                    b.data_bloqueio
                FROM dbo.ArtistasBloqueados b
                INNER JOIN Artistas a
                    ON a.id = b.artista_id
                LEFT JOIN PerfilArtista p
                    ON p.artista_id = a.id
                WHERE b.usuario_id = @usuarioId
                  AND b.usuario_tipo = @tipo
                ORDER BY b.data_bloqueio DESC
            `);

        return res.status(200).json(resultado.recordset);
    } catch (erro) {
        console.error("Erro ao listar bloqueados:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar contas bloqueadas."
        });
    }
});


/* =========================================
   DESBLOQUEAR ARTISTA
========================================= */

router.delete("/bloqueados/:artistaId", verificarToken, async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);
        const usuarioId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;

        if (
            !Number.isSafeInteger(artistaId) || artistaId <= 0 ||
            !Number.isSafeInteger(usuarioId) || usuarioId <= 0
        ) {
            return res.status(400).json({ erro: "ID inválido." });
        }

        if (!["artista", "cliente"].includes(tipo)) {
            return res.status(403).json({ erro: "Usuário não autorizado." });
        }

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input("usuarioId", sql.Int, usuarioId)
            .input("tipo", sql.VarChar(20), tipo)
            .input("artistaId", sql.Int, artistaId)
            .query(`
                DELETE FROM dbo.ArtistasBloqueados
                WHERE usuario_id = @usuarioId
                  AND usuario_tipo = @tipo
                  AND artista_id = @artistaId
            `);

        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({
                erro: "Este artista não está na sua lista de bloqueados."
            });
        }

        return res.status(200).json({
            mensagem: "Artista desbloqueado com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao desbloquear artista:", erro);
        return res.status(500).json({
            erro: "Erro ao desbloquear artista."
        });
    }
});


/* =========================================
   DENUNCIAR ARTISTA COM IMAGENS
========================================= */

router.post(
    "/:artistaId/denunciar",
    verificarToken,
    upload.array("imagens", 5),
    async (req, res) => {
        try {
            const artistaId = Number(req.params.artistaId);
            const denuncianteId = Number(req.usuario.id);
            const tipo = req.usuario.tipo;
            const motivo = typeof req.body.motivo === "string"
                ? req.body.motivo.trim()
                : "";

            if (
                !Number.isSafeInteger(artistaId) || artistaId <= 0 ||
                !Number.isSafeInteger(denuncianteId) || denuncianteId <= 0
            ) {
                return res.status(400).json({ erro: "ID inválido." });
            }

            if (!["artista", "cliente"].includes(tipo)) {
                return res.status(403).json({ erro: "Usuário não autorizado." });
            }

            if (!motivo) {
                return res.status(400).json({
                    erro: "Explique o motivo da denúncia."
                });
            }

            if (motivo.length > 5000) {
                return res.status(400).json({
                    erro: "O motivo deve ter no máximo 5000 caracteres."
                });
            }

            const arquivos = req.files || [];

            if (arquivos.some(arquivo => !arquivo.mimetype.startsWith("image/"))) {
                return res.status(400).json({
                    erro: "Todos os anexos devem ser imagens."
                });
            }

            const pool = await poolPromise;

            const artista = await pool.request()
                .input("artistaId", sql.Int, artistaId)
                .query("SELECT id FROM Artistas WHERE id = @artistaId");

            if (artista.recordset.length === 0) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            if (tipo === "artista" && denuncianteId === artistaId) {
                return res.status(400).json({
                    erro: "Você não pode denunciar a própria conta."
                });
            }

            // Envia as imagens ao Cloudinary antes de registrar a denúncia.
            const imagensEnviadas = [];

            for (const arquivo of arquivos) {
                const nomeArquivo =
                    `denuncia-${denuncianteId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                const imagem = await uploadParaCloudinary(
                    arquivo.buffer,
                    nomeArquivo
                );

                imagensEnviadas.push(imagem.secure_url);
            }

            const denuncia = await pool.request()
                .input("denuncianteId", sql.Int, denuncianteId)
                .input("tipo", sql.VarChar(20), tipo)
                .input("artistaId", sql.Int, artistaId)
                .input("motivo", sql.NVarChar(sql.MAX), motivo)
                .query(`
                    INSERT INTO dbo.DenunciasArtistas
                        (denunciante_id, denunciante_tipo, artista_id, motivo)
                    OUTPUT INSERTED.id
                    VALUES
                        (@denuncianteId, @tipo, @artistaId, @motivo)
                `);

            const denunciaId = denuncia.recordset[0].id;

            for (const url of imagensEnviadas) {
                await pool.request()
                    .input("denunciaId", sql.Int, denunciaId)
                    .input("url", sql.NVarChar(1000), url)
                    .query(`
                        INSERT INTO dbo.ImagensDenunciasArtistas
                            (denuncia_id, url_imagem)
                        VALUES
                            (@denunciaId, @url)
                    `);
            }

            return res.status(201).json({
                mensagem: "Denúncia registrada com sucesso.",
                denunciaId
            });
        } catch (erro) {
            console.error("Erro ao denunciar artista:", erro);
            return res.status(500).json({
                erro: "Erro ao registrar denúncia."
            });
        }
    }
);

module.exports = router;
