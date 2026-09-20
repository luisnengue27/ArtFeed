const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const verificarToken = require("../middleware/authMiddleware");

const router = express.Router();

// Temporário, até conectarmos ao SQL Server
const artistas = [];
const seguidores = [];
// ============================
// CONFIGURAÇÃO DO UPLOAD
// ============================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        const extensao = path.extname(file.originalname);

        const nomeArquivo =
            `artista-${Date.now()}${extensao}`;

        cb(null, nomeArquivo);
    }
});

const upload = multer({
    storage: storage
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

        const artistaExistente = artistas.find(
            artista => artista.email === email
        );

        if (artistaExistente) {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        const senhaCriptografada = await bcrypt.hash(
            senha,
            10
        );

        const novoArtista = {
            id: artistas.length + 1,
            username,
            email,
            senha: senhaCriptografada,
            tipo: "artista"
        };

        artistas.push(novoArtista);

        return res.status(201).json({
            mensagem: "Artista cadastrado com sucesso!",
            artista: {
                id: novoArtista.id,
                username: novoArtista.username,
                email: novoArtista.email,
                tipo: novoArtista.tipo
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

        const artista = artistas.find(
            artista => artista.email === email
        );

        if (!artista) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            artista.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const token = jwt.sign(
            {
                id: artista.id,
                tipo: artista.tipo
            },
            "chave-secreta-artfeed",
            {
                expiresIn: "2h"
            }
        );

        return res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token,

            artista: {
                id: artista.id,
                username: artista.username,
                email: artista.email,
                tipo: artista.tipo
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
// CRIAR PERFIL
// ============================

router.post(
    "/perfil",
    verificarToken,
    upload.single("foto"),
    (req, res) => {
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

            const artista = artistas.find(
                artista => artista.id === req.usuario.id
            );

            if (!artista) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            artista.perfil = {
                nome,
                preco,
                cidade,
                profissao,
                tags: tags
                    .split(",")
                    .map(tag => tag.trim()),
                descricao,
                foto: `/uploads/${req.file.filename}`
            };

            return res.status(201).json({
                mensagem: "Perfil criado com sucesso!",
                perfil: artista.perfil
            });

        } catch (erro) {
            console.error(erro);

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
    (req, res) => {
        try {
            const artista = artistas.find(
                artista => artista.id === req.usuario.id
            );

            if (!artista) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            if (!artista.perfil) {
                return res.status(404).json({
                    erro: "Este artista ainda não possui um perfil."
                });
            }

         return res.status(200).json({
    username: artista.username,
    email: artista.email,
    perfil: artista.perfil
});

        } catch (erro) {
            console.error(erro);

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);

// ============================
// LISTAR TODOS OS PERFIS
// ============================

router.get("/", (req, res) => {
    try {
        const perfis = artistas
            .filter(artista => artista.perfil)
            .map(artista => ({
                id: artista.id,
                username: artista.username,
                ...artista.perfil
            }));

        return res.status(200).json(perfis);

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});
// ============================
// SEGUIR ARTISTA
// ============================

router.post(
    "/:artistaId/seguir",
    verificarToken,
    (req, res) => {

        try {

            // Verifica se quem está fazendo a ação é um cliente
            if (req.usuario.tipo !== "cliente") {
                return res.status(403).json({
                    erro: "Apenas clientes podem seguir artistas."
                });
            }

            const artistaId = Number(req.params.artistaId);
            const clienteId = req.usuario.id;

            // Verifica se o artista existe
            const artista = artistas.find(
                artista => artista.id === artistaId
            );

            if (!artista) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            // Verifica se já está seguindo
            const jaSegue = seguidores.find(
                seguir =>
                    seguir.clienteId === clienteId &&
                    seguir.artistaId === artistaId
            );

            if (jaSegue) {
                return res.status(409).json({
                    erro: "Você já segue este artista."
                });
            }

            // Cria a relação
            seguidores.push({
                clienteId,
                artistaId
            });

            return res.status(201).json({
                mensagem: "Artista seguido com sucesso!"
            });

        } catch (erro) {

            console.error(erro);

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);
// ============================
// DEIXAR DE SEGUIR ARTISTA
// ============================

router.delete(
    "/:artistaId/seguir",
    verificarToken,
    (req, res) => {

        try {

            // Apenas clientes podem deixar de seguir
            if (req.usuario.tipo !== "cliente") {
                return res.status(403).json({
                    erro: "Apenas clientes podem deixar de seguir artistas."
                });
            }

            const artistaId = Number(req.params.artistaId);
            const clienteId = req.usuario.id;

            // Verifica se o artista existe
            const artista = artistas.find(
                artista => artista.id === artistaId
            );

            if (!artista) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            // Procura a relação entre cliente e artista
            const indice = seguidores.findIndex(
                seguir =>
                    seguir.clienteId === clienteId &&
                    seguir.artistaId === artistaId
            );

            // Se não encontrou, não está seguindo
            if (indice === -1) {
                return res.status(404).json({
                    erro: "Você não segue este artista."
                });
            }

            // Remove a relação
            seguidores.splice(indice, 1);

            return res.status(200).json({
                mensagem: "Você deixou de seguir o artista."
            });

        } catch (erro) {

            console.error(erro);

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
    (req, res) => {

        try {

            const artistaId = Number(req.params.artistaId);

            // Verifica se o artista existe
            const artista = artistas.find(
                artista => artista.id === artistaId
            );

            if (!artista) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            // Conta quantos clientes seguem o artista
            const quantidade = seguidores.filter(
                seguir => seguir.artistaId === artistaId
            ).length;

            return res.status(200).json({
                seguidores: quantidade
            });

        } catch (erro) {

            console.error(erro);

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
    (req, res) => {

        try {

            // Apenas clientes podem verificar seus seguimentos
            if (req.usuario.tipo !== "cliente") {
                return res.status(403).json({
                    erro: "Apenas clientes podem realizar esta ação."
                });
            }

            const artistaId = Number(req.params.artistaId);
            const clienteId = req.usuario.id;

            const artista = artistas.find(
                artista => artista.id === artistaId
            );

            if (!artista) {
                return res.status(404).json({
                    erro: "Artista não encontrado."
                });
            }

            const seguindo = seguidores.some(
                seguir =>
                    seguir.clienteId === clienteId &&
                    seguir.artistaId === artistaId
            );

            return res.status(200).json({
                seguindo
            });

        } catch (erro) {

            console.error(erro);

            return res.status(500).json({
                erro: "Erro interno do servidor."
            });
        }
    }
);
router.put("/perfil", verificarToken, async (req, res) => {
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

        const artista = artistas.find(
            artista => artista.id === req.usuario.id
        );

        if (!artista) {
            return res.status(404).json({
                erro: "Artista não encontrado."
            });
        }

        // Dados da conta
        if (username) {
            artista.username = username;
        }

        if (email) {
            const emailExistente = artistas.find(
                outroArtista =>
                    outroArtista.email === email &&
                    outroArtista.id !== artista.id
            );

            if (emailExistente) {
                return res.status(409).json({
                    erro: "Este e-mail já está cadastrado."
                });
            }

            artista.email = email;
        }

        if (senha) {
            artista.senha = await bcrypt.hash(senha, 10);
        }

        // Dados do perfil
        if (nome) {
            artista.perfil.nome = nome;
        }

        if (preco) {
            artista.perfil.preco = preco;
        }

        if (cidade) {
            artista.perfil.cidade = cidade;
        }

        if (profissao) {
            artista.perfil.profissao = profissao;
        }

        if (tags) {
    artista.perfil.tags = tags
        .split(",")
        .map(tag => tag.trim());
}
        if (descricao) {
            artista.perfil.descricao = descricao;
        }

        return res.status(200).json({
            mensagem: "Perfil atualizado com sucesso!",
            artista: {
                id: artista.id,
                username: artista.username,
                email: artista.email,
                tipo: artista.tipo,
                perfil: artista.perfil
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