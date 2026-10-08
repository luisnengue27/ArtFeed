const express = require("express");
const cors = require("cors");

const app = express();

const testeRoutes = require("./routes/teste");
const { poolPromise } = require("./db");
const artistasRoutes = require("./routes/artistas");
const clientesRoutes = require("./routes/clientes");
const chatRoutes = require("./routes/chat");


// CORS precisa vir antes das rotas
app.use(cors());

app.use(express.json());


// Rotas
app.use("/api/teste", testeRoutes);
app.use("/api/artistas", artistasRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/chat", chatRoutes);


// Arquivos estáticos
app.use("/uploads", express.static("uploads"));


const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.send("API do ArtFeed funcionando!");
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});