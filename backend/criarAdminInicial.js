
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("./db");
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
        const pool = await poolPromise;

        const existente = await pool.request().query(`
            SELECT TOP 1 id
            FROM dbo.Administradores
        `);

        if (existente.recordset.length > 0) {
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

        await pool.request()
            .input("username", sql.NVarChar(100), username)
            .input("email", sql.NVarChar(255), email)
            .input("senha_hash", sql.NVarChar(255), senhaHash)
            .query(`
                INSERT INTO dbo.Administradores
                    (username, email, senha_hash)
                VALUES
                    (@username, @email, @senha_hash)
            `);

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
