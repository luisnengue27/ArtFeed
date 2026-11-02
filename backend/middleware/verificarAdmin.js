
const { poolNeon } = require("../db");

// Verifica se o usuário autenticado é um administrador ativo.
async function verificarAdmin(req, res, next) {
    try {
        if (!req.usuario || req.usuario.tipo !== "admin") {
            return res.status(403).json({
                erro: "Acesso permitido apenas para administradores."
            });
        }

        const resultado = await poolNeon.query(
            `SELECT id
             FROM administradores
             WHERE id = $1
               AND ativo = true`,
            [req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(403).json({
                erro: "Administrador inexistente ou inativo."
            });
        }

        next();

    } catch (erro) {
        console.error("Erro ao verificar administrador:", erro);

        return res.status(500).json({
            erro: "Erro ao verificar permissões administrativas."
        });
    }
}

module.exports = verificarAdmin;
