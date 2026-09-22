const express = require("express");
const cors = require("cors");

const app = express();

const testeRoutes = require("./routes/teste");
const { poolPromise } = require("./db");
const artistasRoutes = require("./routes/artistas");
const clientesRoutes = require("./routes/clientes");


app.use("/api/teste", testeRoutes);
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/artistas", artistasRoutes);
app.use("/api/clientes", clientesRoutes);
app.get("/", (req, res) => {
    res.json({
        mensagem: "API do ArtFeed funcionando!"
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});