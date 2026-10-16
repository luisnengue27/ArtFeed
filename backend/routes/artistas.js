const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const verificarToken = require("../middleware/authMiddleware");
const { v2: cloudinary } = require("cloudinary");
const authOpcional = require("../middleware/authOpcional");
const { poolNeon } = require("../db");
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

        const artistaExistente = await poolNeon.query(
            `SELECT id
             FROM artistas
             WHERE email = $1`,
            [email]
        );

        if (artistaExistente.rows.length > 0) {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const resultado = await poolNeon.query(
            `INSERT INTO artistas (username, email, senha)
             VALUES ($1, $2, $3)
             RETURNING id, username, email`,
            [username, email, senhaCriptografada]
        );

        const novoArtista = resultado.rows[0];

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
        console.error("Erro ao cadastrar artista:", erro);
        return res.status(500).json({ erro: "Erro interno do servidor." });
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

        const resultado = await poolNeon.query(
            `SELECT id, username, email, senha
             FROM artistas
             WHERE email = $1`,
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const artista = resultado.rows[0];

        const senhaCorreta = await bcrypt.compare(senha, artista.senha);

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const token = jwt.sign(
            { id: artista.id, tipo: "artista" },
            process.env.JWT_SECRET || "segredo_artfeed",
            { expiresIn: "1d" }
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
        console.error("Erro ao realizar login:", erro);
        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
});

// ============================
// CRIAR PERFIL
// ============================

router.post("/perfil", verificarToken, upload.single("foto"), async (req, res) => {
    try {
        const { nome, preco, cidade, profissao, tags, descricao } = req.body;

        if (!nome || !preco || !cidade || !profissao || !tags || !descricao || !req.file) {
            return res.status(400).json({
                erro: "Todos os campos são obrigatórios."
            });
        }

        const artistaId = req.usuario.id;

        const artista = await poolNeon.query(
            `SELECT id, username, email FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artista.rows.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado." });
        }

        const perfilExistente = await poolNeon.query(
            `SELECT id FROM perfil_artista WHERE artista_id = $1`,
            [artistaId]
        );

        if (perfilExistente.rows.length > 0) {
            return res.status(409).json({
                erro: "Este artista já possui um perfil."
            });
        }

        const nomeArquivo = `perfil-${Date.now()}`;
        const fotoCloudinary = await uploadParaCloudinary(req.file.buffer, nomeArquivo);

        const resultado = await poolNeon.query(
            `INSERT INTO perfil_artista (
                artista_id, nome, preco, cidade, profissao, tags, descricao, foto_perfil
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [artistaId, nome, preco, cidade, profissao, tags, descricao, fotoCloudinary.secure_url]
        );

        const perfil = resultado.rows[0];

        return res.status(201).json({
            mensagem: "Perfil criado com sucesso!",
            perfil: {
                id: perfil.id,
                nome: perfil.nome,
                preco: perfil.preco,
                cidade: perfil.cidade,
                profissao: perfil.profissao,
                tags: perfil.tags.split(",").map(tag => tag.trim()),
                descricao: perfil.descricao,
                foto: perfil.foto_perfil
            }
        });

    } catch (erro) {
        console.error("Erro ao criar perfil:", erro);
        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
});
// ============================
// PEGAR MEU PERFIL
// ============================

router.get("/perfil", verificarToken, async (req, res) => {
    try {
        const artistaId = req.usuario.id;

        const resultado = await poolNeon.query(
            `SELECT
                a.id, a.username, a.email,
                p.id AS perfil_id, p.nome, p.preco, p.cidade,
                p.profissao, p.tags, p.descricao, p.foto_perfil AS foto
             FROM artistas a
             LEFT JOIN perfil_artista p ON a.id = p.artista_id
             WHERE a.id = $1`,
            [artistaId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado." });
        }

        const artista = resultado.rows[0];

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
            tags: artista.tags ? artista.tags.split(",").map(tag => tag.trim()) : [],
            descricao: artista.descricao,
            foto: artista.foto || null
        });

    } catch (erro) {
        console.error("Erro ao buscar perfil:", erro);
        return res.status(500).json({ erro: "Erro ao buscar o perfil do artista." });
    }
});

// ============================
// LISTAR TODOS OS PERFIS
// ============================

router.get("/", authOpcional, async (req, res) => {
    try {
        const usuarioId = req.usuario?.id ?? null;
        const tipoUsuario = req.usuario?.tipo ?? null;

        let resultado;

        if (usuarioId === null) {
            resultado = await poolNeon.query(
                `SELECT
                    a.id, a.username, p.nome, p.preco, p.cidade,
                    p.profissao, p.tags, p.descricao, p.foto_perfil AS foto,
                    CAST(COALESCE(av.avaliacao, 0) AS DECIMAL(3,1)) AS avaliacao,
                    COALESCE(av.numavaliacao, 0) AS numavaliacao
                 FROM artistas a
                 INNER JOIN perfil_artista p ON a.id = p.artista_id
                 LEFT JOIN (
                     SELECT artista_id,
                            AVG(CAST(nota AS DECIMAL(4,2))) AS avaliacao,
                            COUNT(*) AS numavaliacao
                     FROM avaliacoes
                     GROUP BY artista_id
                 ) av ON av.artista_id = a.id`
            );
       } else {
    resultado = await poolNeon.query(
        `SELECT
            a.id, a.username, p.nome, p.preco, p.cidade,
            p.profissao, p.tags, p.descricao, p.foto_perfil AS foto,
            CAST(COALESCE(av.avaliacao, 0) AS DECIMAL(3,1)) AS avaliacao,
            COALESCE(av.numavaliacao, 0) AS numavaliacao
         FROM artistas a
         INNER JOIN perfil_artista p ON a.id = p.artista_id
         LEFT JOIN (
             SELECT artista_id,
                    AVG(CAST(nota AS DECIMAL(4,2))) AS avaliacao,
                    COUNT(*) AS numavaliacao
             FROM avaliacoes
             GROUP BY artista_id
         ) av ON av.artista_id = a.id
         WHERE NOT EXISTS (
             SELECT 1 FROM artistas_bloqueados b
             WHERE b.usuario_id = $1::integer
               AND b.usuario_tipo = $2
               AND b.artista_id = a.id
         )`,
        [usuarioId, tipoUsuario]
    );
}

        const perfis = resultado.rows.map(perfil => ({
            ...perfil,
            foto: perfil.foto || null
        }));

        return res.status(200).json(perfis);

    } catch (erro) {
        console.error("Erro ao buscar perfis:", erro);
        return res.status(500).json({ erro: "Erro ao buscar os perfis dos artistas." });
    }
});
// ============================
// SEGUIR ARTISTA
// ============================

router.post("/:artistaId/seguir", verificarToken, async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);
        const usuarioId = req.usuario.id;
        const tipoUsuario = req.usuario.tipo;

        if (isNaN(artistaId)) {
            return res.status(400).json({ erro: "ID do artista inválido." });
        }

        const artista = await poolNeon.query(
            `SELECT id FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artista.rows.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado." });
        }

        if (tipoUsuario === "artista") {
            if (usuarioId === artistaId) {
                return res.status(400).json({
                    erro: "VocÃª não pode seguir a si mesmo."
                });
            }

            const jaSegue = await poolNeon.query(
                `SELECT id FROM seguidores WHERE artista_seguidor_id = $1 AND artista_id = $2`,
                [usuarioId, artistaId]
            );

            if (jaSegue.rows.length > 0) {
                return res.status(409).json({
                    erro: "VocÃª já segue este artista."
                });
            }

            await poolNeon.query(
                `INSERT INTO seguidores (artista_seguidor_id, artista_id) VALUES ($1, $2)`,
                [usuarioId, artistaId]
            );

            return res.status(201).json({ mensagem: "Artista seguido com sucesso!" });
        }

        if (tipoUsuario === "cliente") {
            const jaSegue = await poolNeon.query(
                `SELECT id FROM seguidores WHERE cliente_id = $1 AND artista_id = $2`,
                [usuarioId, artistaId]
            );

            if (jaSegue.rows.length > 0) {
                return res.status(409).json({
                    erro: "VocÃª já segue este artista."
                });
            }

            await poolNeon.query(
                `INSERT INTO seguidores (cliente_id, artista_id) VALUES ($1, $2)`,
                [usuarioId, artistaId]
            );

            return res.status(201).json({ mensagem: "Artista seguido com sucesso!" });
        }

        return res.status(403).json({ erro: "Tipo de usuário não autorizado." });

    } catch (erro) {
        console.error("Erro ao seguir artista:", erro);
        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
});
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
            return res.status(400).json({ erro: "ID do artista inválido." });
        }

        if (
            !Number.isSafeInteger(avaliadorId) ||
            avaliadorId <= 0 ||
            !["artista", "cliente"].includes(tipo)
        ) {
            return res.status(403).json({ erro: "UsuÃ¡rio não autorizado." });
        }

        if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
            return res.status(400).json({
                erro: "A nota deve ser um nÃºmero inteiro de 1 a 5."
            });
        }

        if (tipo === "artista" && avaliadorId === artistaId) {
            return res.status(400).json({
                erro: "VocÃª não pode avaliar a si mesmo."
            });
        }

        const artista = await poolNeon.query(
            `SELECT id FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artista.rows.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado." });
        }

        const clienteId = tipo === "cliente" ? avaliadorId : null;
        const artistaAvaliadorId = tipo === "artista" ? avaliadorId : null;

    const existente = await poolNeon.query(
    `SELECT id
     FROM avaliacoes
     WHERE artista_id = $1
       AND (
         (CAST($2 AS INTEGER) IS NOT NULL AND cliente_id = $2)
         OR
         (CAST($3 AS INTEGER) IS NOT NULL AND artista_avaliador_id = $3)
       )`,
    [artistaId, clienteId, artistaAvaliadorId]
);

        if (existente.rows.length > 0) {
            return res.status(409).json({
                erro: "VocÃª já avaliou este artista."
            });
        }

        await poolNeon.query(
            `INSERT INTO avaliacoes (
                cliente_id, artista_id, nota, comentario, artista_avaliador_id
            )
            VALUES ($1, $2, $3, $4, $5)`,
            [clienteId, artistaId, nota, null, artistaAvaliadorId]
        );

        const resultado = await poolNeon.query(
            `SELECT
                CAST(AVG(nota) AS DECIMAL(3,1)) AS avaliacao,
                COUNT(*) AS numavaliacao
             FROM avaliacoes
             WHERE artista_id = $1`,
            [artistaId]
        );

        return res.status(201).json({
            mensagem: "AvaliaÃ§Ã£o registrada com sucesso!",
            avaliacao: resultado.rows[0].avaliacao,
            numavaliacao: resultado.rows[0].numavaliacao
        });

    } catch (erro) {
        console.error("Erro ao avaliar artista:", erro);
        return res.status(500).json({ erro: "Erro ao registrar avaliaÃ§Ã£o." });
    }
});
// ============================
// DEIXAR DE SEGUIR ARTISTA
// ============================

router.delete("/:artistaId/seguir", verificarToken, async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);
        const usuarioId = req.usuario.id;
        const tipoUsuario = req.usuario.tipo;

        if (isNaN(artistaId)) {
            return res.status(400).json({ erro: "ID do artista inválido." });
        }

        if (tipoUsuario === "artista") {
            const resultado = await poolNeon.query(
                `DELETE FROM seguidores
                 WHERE artista_seguidor_id = $1 AND artista_id = $2`,
                [usuarioId, artistaId]
            );

            if (resultado.rowCount === 0) {
                return res.status(404).json({
                    erro: "VocÃª não segue este artista."
                });
            }

            return res.status(200).json({
                mensagem: "VocÃª deixou de seguir o artista."
            });
        }

        if (tipoUsuario === "cliente") {
            const resultado = await poolNeon.query(
                `DELETE FROM seguidores
                 WHERE cliente_id = $1 AND artista_id = $2`,
                [usuarioId, artistaId]
            );

            if (resultado.rowCount === 0) {
                return res.status(404).json({
                    erro: "VocÃª não segue este artista."
                });
            }

            return res.status(200).json({
                mensagem: "VocÃª deixou de seguir o artista."
            });
        }

        return res.status(403).json({ erro: "Tipo de usuário não autorizado." });

    } catch (erro) {
        console.error("Erro ao deixar de seguir artista:", erro);
        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
});
// ============================
// CONTAR SEGUIDORES
// ============================

router.get("/:artistaId/seguidores", async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);

        const artista = await poolNeon.query(
            `SELECT id FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artista.rows.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado." });
        }

        const resultado = await poolNeon.query(
            `SELECT COUNT(*) AS seguidores
             FROM seguidores
             WHERE artista_id = $1`,
            [artistaId]
        );

        return res.status(200).json({
            seguidores: resultado.rows[0].seguidores
        });

    } catch (erro) {
        console.error("Erro ao contar seguidores:", erro);
        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
});

// ============================
// VERIFICAR SE ESTÁ SEGUINDO
// ============================

router.get("/:artistaId/seguindo", verificarToken, async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);
        const usuarioId = req.usuario.id;
        const tipoUsuario = req.usuario.tipo;

        if (isNaN(artistaId)) {
            return res.status(400).json({ erro: "ID do artista inválido." });
        }

        const artista = await poolNeon.query(
            `SELECT id FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artista.rows.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado." });
        }

        let resultado;

        if (tipoUsuario === "artista") {
            resultado = await poolNeon.query(
                `SELECT id FROM seguidores
                 WHERE artista_seguidor_id = $1 AND artista_id = $2`,
                [usuarioId, artistaId]
            );
        } else if (tipoUsuario === "cliente") {
            resultado = await poolNeon.query(
                `SELECT id FROM seguidores
                 WHERE cliente_id = $1 AND artista_id = $2`,
                [usuarioId, artistaId]
            );
        } else {
            return res.status(403).json({
                erro: "Tipo de usuário não autorizado."
            });
        }

        return res.status(200).json({
            seguindo: resultado.rows.length > 0
        });

    } catch (erro) {
        console.error("Erro ao verificar se está seguindo:", erro);
        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
});
// EDITAR PERFIL
router.put("/perfil", verificarToken, upload.single("foto"), async (req, res) => {
    try {
        const {
            username, email, senha, nome, preco, cidade,
            profissao, tags, descricao
        } = req.body;

        const artistaId = req.usuario.id;

        const artistaResultado = await poolNeon.query(
            `SELECT id, username, email, senha FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artistaResultado.rows.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado." });
        }

        const artista = artistaResultado.rows[0];

        if (email && email !== artista.email) {
            const emailExistente = await poolNeon.query(
                `SELECT id FROM artistas WHERE email = $1 AND id <> $2`,
                [email, artistaId]
            );
            if (emailExistente.rows.length > 0) {
                return res.status(409).json({
                    erro: "Este e-mail já está cadastrado."
                });
            }
        }

        if (username && username !== artista.username) {
            const usernameExistente = await poolNeon.query(
                `SELECT id FROM artistas WHERE username = $1 AND id <> $2`,
                [username, artistaId]
            );
            if (usernameExistente.rows.length > 0) {
                return res.status(409).json({
                    erro: "Este username já está cadastrado."
                });
            }
        }

        await poolNeon.query(
            `UPDATE artistas
             SET username = $1, email = $2
             WHERE id = $3`,
            [username || artista.username, email || artista.email, artistaId]
        );

        if (senha) {
            const senhaCriptografada = await bcrypt.hash(senha, 10);
            await poolNeon.query(
                `UPDATE artistas SET senha = $1 WHERE id = $2`,
                [senhaCriptografada, artistaId]
            );
        }
await poolNeon.query(
    `UPDATE perfil_artista
     SET nome = $1,
         preco = $2,
         cidade = $3,
         profissao = $4,
         tags = $5,
         descricao = $6
     WHERE artista_id = $7`,
    [nome, preco, cidade, profissao, tags, descricao, artistaId]
);
        if (req.file) {
            const nomeArquivo = `perfil-${artistaId}-${Date.now()}`;
            const fotoCloudinary = await uploadParaCloudinary(req.file.buffer, nomeArquivo);
            await poolNeon.query(
                `UPDATE perfil_artista SET foto_perfil = $1 WHERE artista_id = $2`,
                [fotoCloudinary.secure_url, artistaId]
            );
        }

        

        return res.status(200).json({ mensagem: "Perfil atualizado com sucesso!" });

    } catch (erro) {
        console.error("Erro ao atualizar perfil:", erro);
        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
});
// ============================
// ARTES DO PORTFÃ“LIO
// ============================

router.post("/artes", verificarToken, upload.single("imagem"), async (req, res) => {
    try {
        const artistaId = req.usuario.id;
        const { titulo } = req.body;

        if (!req.file) {
            return res.status(400).json({ erro: "A imagem da arte é obrigatória" });
        }

        const artista = await poolNeon.query(
            `SELECT id FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artista.rows.length === 0) {
            return res.status(404).json({ erro: "Artista não encontrado" });
        }

        const nomeArquivo = `artista-${Date.now()}`;
        const imagemCloudinary = await uploadParaCloudinary(req.file.buffer, nomeArquivo);

        const resultado = await poolNeon.query(
            `INSERT INTO artes (artista_id, titulo, imagem)
             VALUES ($1, $2, $3)
             RETURNING id, artista_id, titulo, imagem, data_publicacao`,
            [artistaId, titulo || null, imagemCloudinary.secure_url]
        );

        res.status(201).json({
            mensagem: "Arte adicionada com sucesso",
            arte: resultado.rows[0]
        });

    } catch (error) {
        console.error("Erro ao cadastrar arte:", error);
        res.status(500).json({ erro: "Erro ao cadastrar arte" });
    }
});

router.get("/minhas-artes", verificarToken, async (req, res) => {
    try {
        const artistaId = req.usuario.id;

        const resultado = await poolNeon.query(
            `SELECT id, artista_id, titulo, imagem, data_publicacao
             FROM artes
             WHERE artista_id = $1
             ORDER BY data_publicacao DESC`,
            [artistaId]
        );

        const artes = resultado.rows.map(arte => ({
            ...arte,
            imagem: arte.imagem
        }));

        return res.status(200).json(artes);

    } catch (error) {
        console.error("Erro ao buscar minhas artes:", error);
        return res.status(500).json({ erro: "Erro ao buscar suas artes." });
    }
});

// ============================
// GET - listar todas as artes
// ============================

router.get("/artes", authOpcional, async (req, res) => {
    try {
        const usuarioId = req.usuario?.id ?? null;
        const tipoUsuario = req.usuario?.tipo ?? null;

        let resultado;

        if (usuarioId === null) {
            resultado = await poolNeon.query(
                "SELECT artes.id, artes.artista_id, artes.titulo, artes.imagem, artes.data_publicacao, artistas.username FROM artes INNER JOIN artistas ON artes.artista_id = artistas.id ORDER BY artes.data_publicacao DESC"
            );
        } else {
            resultado = await poolNeon.query(
                "SELECT artes.id, artes.artista_id, artes.titulo, artes.imagem, artes.data_publicacao, artistas.username FROM artes INNER JOIN artistas ON artes.artista_id = artistas.id WHERE NOT EXISTS (SELECT 1 FROM artistas_bloqueados b WHERE b.usuario_id = $1::integer AND b.usuario_tipo = $2 AND b.artista_id = artes.artista_id) ORDER BY artes.data_publicacao DESC",
                [usuarioId, tipoUsuario]
            );
        }

        return res.json(resultado.rows);

    } catch (erro) {
        console.error("Erro ao buscar artes:", erro);
        return res.status(500).json({ erro: "Erro ao buscar artes." });
    }
});
// ============================
// PORTFÃ“LIO PÃšBLICO DO ARTISTA
// ============================

router.get("/portfolio/:artistaId", verificarToken, async (req, res) => {
    try {
        const artistaId = parseInt(req.params.artistaId);

        if (isNaN(artistaId)) {
            return res.status(400).json({ erro: "ID do artista inválido" });
        }

        const usuarioId = req.usuario.id;
        const tipoUsuario = req.usuario.tipo;

        if (tipoUsuario !== "artista" && tipoUsuario !== "cliente") {
            return res.status(403).json({
                erro: "Tipo de usuário inválido."
            });
        }

        const bloqueio = await poolNeon.query(
            `SELECT id
             FROM artistas_bloqueados
             WHERE usuario_id = $1
               AND usuario_tipo = $2
               AND artista_id = $3
             LIMIT 1`,
            [usuarioId, tipoUsuario, artistaId]
        );

        if (bloqueio.rows.length > 0) {
            return res.status(404).json({
                erro: "Este portfÃ³lio nÃ£o estÃ¡ disponÃ­vel."
            });
        }

        const artistaBase = await poolNeon.query(
            `SELECT id, username, email FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artistaBase.rows.length === 0) {
            return res.status(404).json({ erro: "Artista nÃ£o encontrado" });
        }

    const artistaResult = await poolNeon.query(
    `SELECT
        a.id, a.username, a.email,
        p.nome, p.preco, p.cidade, p.profissao,
        p.tags, p.descricao, p.foto_perfil
     FROM artistas a
     LEFT JOIN perfil_artista p ON a.id = p.artista_id
     WHERE a.id = $1`,
    [artistaId]
);

        const artista = artistaResult.rows[0];

        if (!artista.nome) {
            return res.status(404).json({
                erro: "Este artista ainda nÃ£o possui um perfil."
            });
        }

        const artesResult = await poolNeon.query(
            `SELECT id, artista_id, titulo, imagem, data_publicacao
             FROM artes
             WHERE artista_id = $1
             ORDER BY data_publicacao DESC`,
            [artistaId]
        );

        const artes = artesResult.rows.map(arte => ({
            ...arte,
            imagem: arte.imagem
        }));

        return res.json({ artista, artes });

    } catch (error) {
        console.error("Erro ao buscar portfÃ³lio:", error);
        return res.status(500).json({ erro: "Erro ao buscar portfÃ³lio" });
    }
});
// ============================
// GET - artes carrossel
// ============================

router.get("/artes-carrossel", authOpcional, async (req, res) => {
    try {
        const usuarioId = req.usuario?.id ?? null;
        const tipoUsuario = req.usuario?.tipo ?? null;

        if (usuarioId === null) {
            resultado = await poolNeon.query(
                "SELECT artes.id, artes.titulo, artes.imagem, artes.artista_id, perfil_artista.nome AS artista_nome FROM artes INNER JOIN perfil_artista ON artes.artista_id = perfil_artista.artista_id ORDER BY artes.data_publicacao DESC"
            );
        } else {
            resultado = await poolNeon.query(
                "SELECT artes.id, artes.titulo, artes.imagem, artes.artista_id, perfil_artista.nome AS artista_nome FROM artes INNER JOIN perfil_artista ON artes.artista_id = perfil_artista.artista_id WHERE NOT EXISTS (SELECT 1 FROM artistas_bloqueados b WHERE b.usuario_id = $1::integer AND b.usuario_tipo = $2 AND b.artista_id = artes.artista_id) ORDER BY artes.data_publicacao DESC",
                [usuarioId, tipoUsuario]
            );
        }

        return res.json(resultado.rows);

    } catch (erro) {
        console.error("Erro ao buscar artes do carrossel:", erro);
        return res.status(500).json({ erro: "Erro ao buscar artes." });
    }
});

// ============================
// BLOQUEAR ARTISTA
// ============================

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
            return res.status(403).json({ erro: "UsuÃ¡rio nÃ£o autorizado." });
        }

        if (tipo === "artista" && usuarioId === artistaId) {
            return res.status(400).json({
                erro: "VocÃª não pode bloquear a prÃ³pria conta."
            });
        }

        const artista = await poolNeon.query(
            `SELECT id FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artista.rows.length === 0) {
            return res.status(404).json({ erro: "Artista nÃ£o encontrado." });
        }

        const existente = await poolNeon.query(
            `SELECT id FROM artistas_bloqueados
             WHERE usuario_id = $1
               AND usuario_tipo = $2
               AND artista_id = $3`,
            [usuarioId, tipo, artistaId]
        );

        if (existente.rows.length > 0) {
            return res.status(409).json({
                erro: "VocÃª jÃ¡ bloqueou este artista."
            });
        }

        await poolNeon.query(
            `INSERT INTO artistas_bloqueados
             (usuario_id, usuario_tipo, artista_id)
             VALUES ($1, $2, $3)`,
            [usuarioId, tipo, artistaId]
        );

        return res.status(201).json({
            mensagem: "Artista bloqueado com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao bloquear artista:", erro);
        return res.status(500).json({ erro: "Erro ao bloquear artista." });
    }
});
// ============================
// LISTAR CONTAS BLOQUEADAS
// ============================

router.get("/bloqueados", verificarToken, async (req, res) => {
    try {
        const usuarioId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;

        if (!["artista", "cliente"].includes(tipo)) {
            return res.status(403).json({ erro: "UsuÃ¡rio nÃ£o autorizado." });
        }

        const resultado = await poolNeon.query(
            `SELECT
                a.id, a.username, p.nome, p.foto_perfil AS foto,
                p.profissao, p.cidade, b.data_bloqueio
             FROM artistas_bloqueados b
             INNER JOIN artistas a ON a.id = b.artista_id
             LEFT JOIN perfil_artista p ON p.artista_id = a.id
             WHERE b.usuario_id = $1
               AND b.usuario_tipo = $2
             ORDER BY b.data_bloqueio DESC`,
            [usuarioId, tipo]
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error("Erro ao listar bloqueados:", erro);
        return res.status(500).json({ erro: "Erro ao buscar contas bloqueadas." });
    }
});

// ============================
// DESBLOQUEAR ARTISTA
// ============================

router.delete("/bloqueados/:artistaId", verificarToken, async (req, res) => {
    try {
        const artistaId = Number(req.params.artistaId);
        const usuarioId = Number(req.usuario.id);
        const tipo = req.usuario.tipo;

        if (
            !Number.isSafeInteger(artistaId) || artistaId <= 0 ||
            !Number.isSafeInteger(usuarioId) || usuarioId <= 0
        ) {
            return res.status(400).json({ erro: "ID invÃ¡lido." });
        }

        if (!["artista", "cliente"].includes(tipo)) {
            return res.status(403).json({ erro: "UsuÃ¡rio nÃ£o autorizado." });
        }

        const resultado = await poolNeon.query(
            `DELETE FROM artistas_bloqueados
             WHERE usuario_id = $1
               AND usuario_tipo = $2
               AND artista_id = $3`,
            [usuarioId, tipo, artistaId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                erro: "Este artista nÃ£o estÃ¡ na sua lista de bloqueados."
            });
        }

        return res.status(200).json({
            mensagem: "Artista desbloqueado com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao desbloquear artista:", erro);
        return res.status(500).json({ erro: "Erro ao desbloquear artista." });
    }
});
// ============================
// DENUNCIAR ARTISTA
// ============================

router.post("/:artistaId/denunciar", verificarToken, async (req, res) => {
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
            return res.status(400).json({ erro: "ID invÃ¡lido." });
        }

        if (!["artista", "cliente"].includes(tipo)) {
            return res.status(403).json({ erro: "UsuÃ¡rio nÃ£o autorizado." });
        }

        if (!motivo) {
            return res.status(400).json({
                erro: "Explique o motivo da denÃºncia."
            });
        }

        if (motivo.length > 5000) {
            return res.status(400).json({
                erro: "O motivo deve ter no mÃ¡ximo 5000 caracteres."
            });
        }

        const arquivos = req.files || [];

        if (arquivos.some(arquivo => !arquivo.mimetype.startsWith("image/"))) {
            return res.status(400).json({
                erro: "Todos os anexos devem ser imagens."
            });
        }

        const artista = await poolNeon.query(
            `SELECT id FROM artistas WHERE id = $1`,
            [artistaId]
        );

        if (artista.rows.length === 0) {
            return res.status(404).json({ erro: "Artista nÃ£o encontrado." });
        }

        if (tipo === "artista" && denuncianteId === artistaId) {
            return res.status(400).json({
                erro: "VocÃª não pode denunciar a prÃ³pria conta."
            });
        }

        const imagensEnviadas = [];

        for (const arquivo of arquivos) {
            const nomeArquivo =
                `denuncia-${denuncianteId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const imagem = await uploadParaCloudinary(arquivo.buffer, nomeArquivo);
            imagensEnviadas.push(imagem.secure_url);
        }

        const denuncia = await poolNeon.query(
            `INSERT INTO denuncias_artistas
             (denunciante_id, denunciante_tipo, artista_id, motivo)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [denuncianteId, tipo, artistaId, motivo]
        );

        const denunciaId = denuncia.rows[0].id;

        for (const url of imagensEnviadas) {
            await poolNeon.query(
                `INSERT INTO imagens_denuncias_artistas
                 (denuncia_id, url_imagem)
                 VALUES ($1, $2)`,
                [denunciaId, url]
            );
        }

        return res.status(201).json({
            mensagem: "DenÃºncia registrada com sucesso.",
            denunciaId
        });

    } catch (erro) {
        console.error("Erro ao denunciar artista:", erro);
        return res.status(500).json({ erro: "Erro ao registrar denÃºncia." });
    }
});
// ============================
// LISTAR ARTISTAS QUE EU SIGO
// ============================

router.get("/meus-seguidos", verificarToken, async (req, res) => {
    try {
        const usuarioId = Number(req.usuario.id);
        const tipoUsuario = req.usuario.tipo;

        if (
            !Number.isSafeInteger(usuarioId) ||
            usuarioId <= 0 ||
            !["artista", "cliente"].includes(tipoUsuario)
        ) {
            return res.status(403).json({
                erro: "Usuário não autorizado."
            });
        }

        let resultado;

        if (tipoUsuario === "artista") {
            resultado = await poolNeon.query(
                `SELECT
                    a.id,
                    a.username,
                    p.nome,
                    p.foto_perfil AS foto,
                    p.profissao,
                    p.cidade
                 FROM seguidores s
                 INNER JOIN artistas a
                    ON a.id = s.artista_id
                 LEFT JOIN perfil_artista p
                    ON p.artista_id = a.id
                 WHERE s.artista_seguidor_id = $1
                 ORDER BY s.id DESC`,
                [usuarioId]
            );
        } else {
            resultado = await poolNeon.query(
                `SELECT
                    a.id,
                    a.username,
                    p.nome,
                    p.foto_perfil AS foto,
                    p.profissao,
                    p.cidade
                 FROM seguidores s
                 INNER JOIN artistas a
                    ON a.id = s.artista_id
                 LEFT JOIN perfil_artista p
                    ON p.artista_id = a.id
                 WHERE s.cliente_id = $1
                 ORDER BY s.id DESC`,
                [usuarioId]
            );
        }

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error("Erro ao listar artistas seguidos:", erro);

        return res.status(500).json({
            erro: "Erro ao carregar os artistas seguidos."
        });
    }
});

module.exports = router;

