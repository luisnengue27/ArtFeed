
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import "./Login.css";

const LoginCliente = () => {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro("");
        setMensagem("");

        try {
            const resposta = await apiFetch(
                "/api/clientes/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, senha })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro);
                return;
            }

            localStorage.removeItem("token");
            localStorage.removeItem("artista");

            localStorage.setItem("tokenCliente", dados.token);
            localStorage.setItem(
                "cliente",
                JSON.stringify(dados.cliente)
            );

            window.dispatchEvent(
                new Event("loginStatusChanged")
            );

            setMensagem(dados.mensagem);

            console.log("Cliente logado:", dados.cliente);
        } catch (erro) {
            console.error(erro);
            setErro("Não foi possível conectar com o servidor.");
        }
    };

    return (
        <main className="login-pagina">
            <Link to="/" className="login-logo">
                <span>✦</span>
                ArtFeed
            </Link>

            <p className="login-subtitulo">
                Descubra artistas e encontre novas inspirações.
            </p>

            <section className="login-card">
                <h1>Login de Cliente</h1>

                <p className="login-descricao">
                    Entre para explorar portfólios e se conectar
                    com artistas.
                </p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="login-cliente-email">
                            E-mail
                        </label>

                        <input
                            id="login-cliente-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="login-cliente-senha">
                            Senha
                        </label>

                        <input
                            id="login-cliente-senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button type="submit">Entrar</button>
                </form>

                {mensagem && (
                    <p className="login-mensagem">{mensagem}</p>
                )}

                {erro && (
                    <p className="login-erro">{erro}</p>
                )}

                <p className="login-cadastro">
                    Ainda não tem uma conta?{" "}
                    <Link to="/cadastro/cliente">
                        Cadastre-se como cliente
                    </Link>
                </p>

                <p className="login-alternar">
                    É artista?{" "}
                    <Link to="/login">
                        Entrar como artista
                    </Link>
                </p>
            </section>

            <Link to="/cadastro" className="login-voltar">
                ← Voltar para opções de cadastro
            </Link>
        </main>
    );
};

export default LoginCliente;
