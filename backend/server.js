
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

const fs = require("fs");
const express = require("express");

// Rotas
const contatoRoutes = require("./routes/contato");
const testeRoutes = require("./routes/teste");
const { poolPromise } = require("./db");
const artistasRoutes = require("./routes/artistas");
const clientesRoutes = require("./routes/clientes");
const chatRoutes = require("./routes/chat");
const adminRoutes = require("./routes/admin");
// Criar o servidor antes de usar app.use()
const app = express();


const cors = require("cors");

const origensPermitidas = [
    "http://localhost:5173",
    "https://artfeed-frontend.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem Origin, como alguns testes locais.
        if (!origin || origensPermitidas.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origem não permitida pelo CORS."));
    }
}));


app.use(express.json());

// Diagnóstico da rota de contato
app.use((req, res, next) => {
    if (req.path === "/api/contato") {
        console.log(
            `[DIAGNOSTICO] ${req.method} ${req.originalUrl} recebido`
        );
    }

    next();
});

// Rotas da API
app.use("/api/teste", testeRoutes);
app.use("/api/artistas", artistasRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/contato", contatoRoutes);
app.use("/api/admin", adminRoutes);
// Arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("API do ArtFeed funcionando!");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
