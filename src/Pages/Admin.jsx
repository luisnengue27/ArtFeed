
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Admin.css";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

function Admin() {
    const navigate = useNavigate();

    const [carregando, setCarregando] = useState(true);
    const [administrador, setAdministrador] = useState(null);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const [enviando, setEnviando] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState("");

    useEffect(() => {
        let ativo = true;

        async function verificarAcesso() {
            const token = localStorage.getItem("tokenAdmin");

            if (!token) {
                navigate("/login/admin", { replace: true });
                return;
            }

            try {
                const resposta = await fetch(
                    `${API_URL}/api/admin/verificar`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!resposta.ok) {
                    throw new Error("Sessão inválida.");
                }

                const dadosAdmin = localStorage.getItem("administrador");
                const admin = dadosAdmin ? JSON.parse(dadosAdmin) : null;

                if (!admin || !admin.id) {
                    throw new Error("Dados administrativos não encontrados.");
                }

                if (ativo) {
                    setAdministrador(admin);
                    setCarregando(false);
                }
            } catch {
                localStorage.removeItem("tokenAdmin");
                localStorage.removeItem("administrador");

                if (ativo) {
                    navigate("/login/admin", { replace: true });
                }
            }
        }

        verificarAcesso();

        return () => {
            ativo = false;
        };
    }, [navigate]);

    async function cadastrarAdministrador(e) {
        e.preventDefault();

        setMensagem("");
        setTipoMensagem("");

        const token = localStorage.getItem("tokenAdmin");

        if (!token) {
            sair();
            return;
        }

        setEnviando(true);

        try {
            const resposta = await fetch(
                `${API_URL}/api/admin/cadastrar`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        username: username.trim(),
                        email: email.trim(),
                        senha
                    })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                if (resposta.status === 401 || resposta.status === 403) {
                    localStorage.removeItem("tokenAdmin");
                    localStorage.removeItem("administrador");
                    navigate("/login/admin", { replace: true });
                    return;
                }

                throw new Error(
                    dados.erro || "Não foi possível cadastrar o administrador."
                );
            }

            setMensagem("Administrador cadastrado com sucesso!");
            setTipoMensagem("sucesso");

            setUsername("");
            setEmail("");
            setSenha("");
        } catch (erro) {
            setMensagem(
                erro.message || "Erro ao conectar com o servidor."
            );
            setTipoMensagem("erro");
        } finally {
            setEnviando(false);
        }
    }

    function sair() {
        localStorage.removeItem("tokenAdmin");
        localStorage.removeItem("administrador");
        navigate("/login/admin", { replace: true });
    }

    if (carregando) {
        return (
            <main className="admin-carregando">
                Verificando acesso administrativo...
            </main>
        );
    }

    if (!administrador) {
        return null;
    }

    return (
        <main className="admin-pagina">
            <header className="admin-topo">
                <div>
                    <span className="admin-logo">✦ ArtFeed</span>
                    <h1>Painel Administrativo</h1>
                    <p>
                        Bem-vindo, {administrador.username || "Administrador"}!
                    </p>
                </div>

                <button
                    className="admin-botao-sair"
                    onClick={sair}
                >
                    Sair da conta
                </button>
            </header>

            <section className="admin-boas-vindas">
                <h2>Área de gerenciamento</h2>
                <p>
                    Gerencie os acessos administrativos da plataforma ArtFeed.
                </p>
            </section>

            <section className="admin-secao">
                <div className="admin-secao-titulo">
                    <div className="admin-secao-icone">♙</div>

                    <div>
                        <h2>Cadastrar administrador</h2>
                        <p>
                            Crie uma nova conta com acesso à área administrativa.
                        </p>
                    </div>
                </div>

                <form
                    className="admin-formulario"
                    onSubmit={cadastrarAdministrador}
                >
                    <div className="admin-campo">
                        <label htmlFor="admin-username">
                            Nome de usuário
                        </label>

                        <input
                            id="admin-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nome do administrador"
                            maxLength={100}
                            autoComplete="off"
                            required
                        />
                    </div>

                    <div className="admin-campo">
                        <label htmlFor="admin-email">
                            E-mail
                        </label>

                        <input
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@exemplo.com"
                            maxLength={255}
                            autoComplete="off"
                            required
                        />
                    </div>

                    <div className="admin-campo">
                        <label htmlFor="admin-senha">
                            Senha
                        </label>

                        <input
                            id="admin-senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Mínimo de 8 caracteres"
                            minLength={8}
                            autoComplete="new-password"
                            required
                        />

                        <small>
                            Use pelo menos 8 caracteres.
                        </small>
                    </div>

                    {mensagem && (
                        <p
                            className={`admin-mensagem admin-mensagem-${tipoMensagem}`}
                            role="status"
                        >
                            {mensagem}
                        </p>
                    )}

                    <button
                        className="admin-botao-cadastrar"
                        type="submit"
                        disabled={enviando}
                    >
                        {enviando
                            ? "Cadastrando..."
                            : "Cadastrar administrador"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default Admin;
