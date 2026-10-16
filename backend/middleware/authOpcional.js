
const jwt = require("jsonwebtoken");
const { poolNeon } = require("../db");

const authOpcional = async (req, res, next) => {
    const cabecalho = req.headers.authorization;

    // Visitantes sem token continuam podendo acessar
    // as rotas públicas.
    if (!cabecalho) {
        req.usuario = null;
        return next();
    }

    let usuario;

    // 1. Validar o token.
    try {
        const partes = cabecalho.split(" ");

        if (partes.length !== 2 || partes[0] !== "Bearer") {
            return res.status(401).json({
                erro: "Formato do token inválido."
            });
        }

        usuario = jwt.verify(
            partes[1],
            process.env.JWT_SECRET || "segredo_artfeed"
        );

        if (!usuario.id || !usuario.tipo) {
            return res.status(401).json({
                erro: "Token inválido."
            });
        }
    } catch (erro) {
        return res.status(401).json({
            erro: "Token inválido ou expirado."
        });
    }

    // 2. Administradores são verificados nas rotas administrativas.
    if (usuario.tipo === "admin") {
        req.usuario = usuario;
        return next();
    }

    // 3. Conferir se a conta continua ativa.
    try {
        let resultado;

        if (usuario.tipo === "artista") {
            resultado = await poolNeon.query(
                `SELECT id
                 FROM artistas
                 WHERE id = $1
                   AND ativo = true`,
                [usuario.id]
            );
        } else if (usuario.tipo === "cliente") {
            resultado = await poolNeon.query(
                `SELECT id
                 FROM clientes
                 WHERE id = $1
                   AND ativo = true`,
                [usuario.id]
            );
        } else {
            return res.status(403).json({
                erro: "Tipo de usuário não autorizado."
            });
        }

        if (resultado.rows.length === 0) {
            return res.status(403).json({
                erro: "Sua conta está desativada ou não existe."
            });
        }

        req.usuario = usuario;
        return next();

    } catch (erro) {
        console.error("Erro na autenticação opcional:", erro);

        return res.status(500).json({
            erro: "Não foi possível verificar o estado da conta."
        });
    }
};

module.exports = authOpcional;
