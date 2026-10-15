const jwt = require("jsonwebtoken");

const authOpcional = (req, res, next) => {
    try {
        const cabecalho = req.headers.authorization;

        // Se não houver token, permite continuar como visitante.
        if (!cabecalho) {
            req.usuario = null;
            return next();
        }

        const partes = cabecalho.split(" ");

        if (partes.length !== 2 || partes[0] !== "Bearer") {
            return res.status(401).json({
                erro: "Formato do token inválido."
            });
        }

        const token = partes[1];

        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET || "segredo_artfeed"
        );

        req.usuario = usuario;

        next();
    } catch (erro) {
        return res.status(401).json({
            erro: "Token inválido ou expirado."
        });
    }
};

module.exports = authOpcional;