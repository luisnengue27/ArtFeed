
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import "./Login.css";

const Login = () => {
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
                "/api/artistas/login",
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

            localStorage.removeItem("tokenCliente");
            localStorage.removeItem("cliente");

            localStorage.setItem("token", dados.token);
            localStorage.setItem(
                "artista",
                JSON.stringify(dados.artista)
            );

            window.dispatchEvent(
                new Event("loginStatusChanged")
            );

            setMensagem(dados.mensagem);

            console.log("Artista logado:", dados.artista);
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
                Entre na sua conta e continue explorando a arte.
            </p>

            <section className="login-card">
                <h1>Login de Artista</h1>

                <p className="login-descricao">
                    Acesse sua conta para gerenciar seu perfil
                    e compartilhar suas criações.
                </p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="login-artista-email">
                            E-mail
                        </label>

                        <input
                            id="login-artista-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="login-artista-senha">
                            Senha
                        </label>

                        <input
                            id="login-artista-senha"
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
                    <Link to="/cadastro/artista">
                        Cadastre-se como artista
                    </Link>
                </p>

                <p className="login-alternar">
                    É cliente?{" "}
                    <Link to="/login/cliente">
                        Entrar como cliente
                    </Link>
                </p>
            </section>

            <Link to="/cadastro" className="login-voltar">
                ← Voltar para opções de cadastro
            </Link>
        </main>
    );
};

export default Login;
