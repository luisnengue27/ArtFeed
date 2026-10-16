
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const bcrypt = require("bcrypt");
const { poolNeon } = require("./db");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(texto) {
    return new Promise(resolve => {
        rl.question(texto, resolve);
    });
}

async function criarAdminInicial() {
    try {
        const existente = await poolNeon.query(
            `SELECT id
             FROM administradores
             LIMIT 1`
        );

        if (existente.rows.length > 0) {
            console.log(
                "Já existe um administrador. Nenhuma conta foi criada."
            );
            return;
        }

        const username = (await perguntar("Nome de usuario: ")).trim();
        const email = (await perguntar("E-mail: ")).trim();
        const senha = await perguntar("Senha (minimo 8 caracteres): ");

        if (!username || username.length > 100) {
            throw new Error("Nome de usuario invalido.");
        }

        if (!email || email.length > 255 || !email.includes("@")) {
            throw new Error("E-mail invalido.");
        }

        if (senha.length < 8) {
            throw new Error("A senha deve ter pelo menos 8 caracteres.");
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        await poolNeon.query(
            `INSERT INTO administradores
                (username, email, senha_hash)
             VALUES
                ($1, $2, $3)`,
            [username, email, senhaHash]
        );

        console.log("Administrador inicial criado com sucesso!");
        console.log("Agora voce pode fazer login no ArtFeed.");
    } catch (erro) {
        console.error("Erro:", erro.message || erro);
    } finally {
        rl.close();
        process.exit();
    }
}

criarAdminInicial();
