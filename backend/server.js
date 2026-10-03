const express = require("express");
const cors = require("cors");

const app = express();

const testeRoutes = require("./routes/teste");
const artistasRoutes = require("./routes/artistas");
const clientesRoutes = require("./routes/clientes");

require("./db");

// CORS deve vir antes das rotas
app.use(cors());
app.use((req, res, next) => {
    console.log("REQUISIÇÃO:", req.method, req.originalUrl);
    console.log("ORIGIN:", req.headers.origin);
    next();
});


app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/teste", testeRoutes);
app.use("/api/artistas", artistasRoutes);
app.use("/api/clientes", clientesRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do ArtFeed funcionando!"
    });
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
