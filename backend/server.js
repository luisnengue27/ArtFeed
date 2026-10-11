const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env"),
});
const fs = require("fs");
const contatoRoutes = require("./routes/contato");
const express = require("express");
const cors = require("cors");

const app = express();
console.log("EMAIL_USER configurado:", Boolean(process.env.EMAIL_USER));
console.log(
  "EMAIL_APP_PASSWORD configurada:",
  Boolean(process.env.EMAIL_APP_PASSWORD)
);
const testeRoutes = require("./routes/teste");
const { poolPromise } = require("./db");
const artistasRoutes = require("./routes/artistas");
const clientesRoutes = require("./routes/clientes");
const chatRoutes = require("./routes/chat");


// CORS precisa vir antes das rotas
app.use((req, res, next) => {
    if (req.path === "/api/contato") {
        console.log(
            `[DIAGNOSTICO] ${req.method} ${req.originalUrl} recebido`
        );
    }

    next();
});;


// Rotas
app.use("/api/teste", testeRoutes);
app.use("/api/artistas", artistasRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/contato", contatoRoutes);

// Arquivos estáticos
app.use("/uploads", express.static("uploads"));


const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.send("API do ArtFeed funcionando!");
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});