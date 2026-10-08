const express = require("express");
const router = express.Router();

const { poolPromise } = require("../db");
const verificarToken = require("../middleware/authMiddleware");


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

        if (tipo === "artista") {

            resultado = await pool.request()
                .input("artista_id", usuarioId)
                .query(`
                    SELECT
                        c.id AS conversa_id,

                        CASE
                            WHEN c.artista_id = @artista_id
                                THEN c.artista_destino_id
                            ELSE c.artista_id
                        END AS outro_artista_id,

                        CASE
                            WHEN c.artista_id = @artista_id
                                THEN destino.username
                            ELSE origem.username
                        END AS outro_username,

                        m.texto AS ultima_mensagem,
                        m.data_envio AS ultima_mensagem_data

                    FROM Conversas c

                    LEFT JOIN Artistas origem
                        ON origem.id = c.artista_id

                    LEFT JOIN Artistas destino
                        ON destino.id = c.artista_destino_id

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
module.exports = router;