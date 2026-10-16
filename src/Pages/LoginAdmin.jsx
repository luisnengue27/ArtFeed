
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginAdmin.css";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

function LoginAdmin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setErro("");
        setCarregando(true);

        try {
            const resposta = await fetch(`${API_URL}/api/admin/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível realizar o login."
                );
            }

            localStorage.setItem("tokenAdmin", dados.token);
            localStorage.setItem(
                "administrador",
                JSON.stringify(dados.administrador)
                
            );
            window.dispatchEvent(new Event("loginStatusChanged"));

            navigate("/admin");
        } catch (error) {
            setErro(
                error.message ||
                "Não foi possível conectar ao servidor."
            );
        } finally {
            setCarregando(false);
        }
    }

    return (
        <main className="login-admin-pagina">
            <section className="login-admin-card">
                <Link to="/" className="login-admin-logo">
                    ✦ ArtFeed
                </Link>

                <div className="login-admin-icone">⚙</div>

                <h1>Área administrativa</h1>

                <p className="login-admin-descricao">
                    Entre com sua conta de administrador.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="admin-email">E-mail</label>
                    <input
                        id="admin-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu e-mail"
                        required
                    />

                    <label htmlFor="admin-senha">Senha</label>
                    <input
                        id="admin-senha"
                        type="password"
                        autoComplete="current-password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Sua senha"
                        required
                    />

                    {erro && (
                        <p className="login-admin-erro" role="alert">
                            {erro}
                        </p>
                    )}

                    <button type="submit" disabled={carregando}>
                        {carregando ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <Link to="/cadastro" className="login-admin-voltar">
                    Voltar para o cadastro
                </Link>
            </section>
        </main>
    );
}

export default LoginAdmin;
