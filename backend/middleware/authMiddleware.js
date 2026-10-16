
const jwt = require("jsonwebtoken");
const { poolNeon } = require("../db");

const verificarToken = async (req, res, next) => {
    let usuario;

    // 1. Validar o token.
    try {
        const cabecalho = req.headers.authorization;

        if (!cabecalho) {
            return res.status(401).json({
                erro: "Token não fornecido."
            });
        }

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

    // 2. Administradores continuam sendo verificados
    // pela função verificarAdmin do arquivo admin.js.
    if (usuario.tipo === "admin") {
        req.usuario = usuario;
        return next();
    }

    // 3. Verificar se o artista ou cliente continua ativo.
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
        console.error("Erro ao verificar estado da conta:", erro);

        return res.status(500).json({
            erro: "Não foi possível verificar o estado da conta."
        });
    }
};

module.exports = verificarToken;
