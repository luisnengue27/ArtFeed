
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";
import "../NavBar/NavBar.css";

const Navbar = () => {
    const [tipoUsuario, setTipoUsuario] = useState(null);
    const [perfilUsuario, setPerfilUsuario] = useState(null);
    const [pesquisa, setPesquisa] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        let ativo = true;

        const verificarLogin = async () => {
            const tokenAdmin = localStorage.getItem("tokenAdmin");
            const tokenArtista = localStorage.getItem("token");
            const tokenCliente = localStorage.getItem("tokenCliente");

            // A sessão administrativa tem prioridade.
            if (tokenAdmin) {
                let admin = {};

                try {
                    admin = JSON.parse(
                        localStorage.getItem("administrador") || "{}"
                    );
                } catch {
                    admin = {};
                }

                if (ativo) {
                    setTipoUsuario("admin");
                    setPerfilUsuario({
                        username: admin.username || "Administrador",
                        foto: ""
                    });
                }

                return;
            }

            const tipo = tokenCliente
                ? "cliente"
                : tokenArtista
                    ? "artista"
                    : null;

            if (ativo) {
                setTipoUsuario(tipo);
            }

            if (!tipo) {
                if (ativo) setPerfilUsuario(null);
                return;
            }

            const chaveLocal =
                tipo === "cliente" ? "cliente" : "artista";

            const token =
                tipo === "cliente" ? tokenCliente : tokenArtista;

            let perfilLocal = {};

            try {
                perfilLocal = JSON.parse(
                    localStorage.getItem(chaveLocal) || "{}"
                );
            } catch {
                perfilLocal = {};
            }

            if (ativo) {
                setPerfilUsuario({
                    username:
                        perfilLocal.username || perfilLocal.nome || "",
                    foto:
                        perfilLocal.foto ||
                        perfilLocal.foto_perfil ||
                        perfilLocal.imagem ||
                        ""
                });
            }

            try {
                const rota =
                    tipo === "cliente"
                        ? "/api/clientes/perfil"
                        : "/api/artistas/perfil";

                const resposta = await apiFetch(rota, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!resposta.ok) return;

                const dados = await resposta.json();

                const perfil =
                    tipo === "cliente"
                        ? dados.cliente || dados
                        : dados.perfil || dados;

                if (!ativo || !perfil) return;

                const username =
                    perfil.username ||
                    perfil.nome ||
                    perfilLocal.username ||
                    perfilLocal.nome ||
                    "";

                const foto =
                    perfil.foto ||
                    perfil.foto_perfil ||
                    perfil.imagem ||
                    perfilLocal.foto ||
                    perfilLocal.foto_perfil ||
                    perfilLocal.imagem ||
                    "";

                setPerfilUsuario({ username, foto });

                localStorage.setItem(
                    chaveLocal,
                    JSON.stringify({
                        ...perfilLocal,
                        ...perfil,
                        username,
                        foto,
                        foto_perfil: foto
                    })
                );
            } catch (erro) {
                console.error(
                    "Não foi possível atualizar os dados da navbar:",
                    erro
                );
            }
        };

        verificarLogin();

        window.addEventListener(
            "loginStatusChanged",
            verificarLogin
        );

        window.addEventListener("storage", verificarLogin);

        return () => {
            ativo = false;

            window.removeEventListener(
                "loginStatusChanged",
                verificarLogin
            );

            window.removeEventListener("storage", verificarLogin);
        };
    }, []);

    const realizarPesquisa = (e) => {
        if (e.key !== "Enter") return;

        const termo = pesquisa.trim();

        if (!termo) return;

        navigate(`/perfis?busca=${encodeURIComponent(termo)}`);
    };

    const username = perfilUsuario?.username || "Meu Perfil";
    const foto = perfilUsuario?.foto;

    const inicial =
        username !== "Meu Perfil"
            ? username.charAt(0).toUpperCase()
            : "U";

    const rotaPerfil =
        tipoUsuario === "admin"
            ? "/admin"
            : tipoUsuario === "cliente"
                ? "/perfil-cliente"
                : "/perfil-artista";

    return (
        <nav className="navbar">
            <Link to="/" className="logo navbar-logo">
                ArtFeed
            </Link>

            <ul className="nav-links">
                <li><Link to="/">Início</Link></li>
                <li><Link to="/explorar">Explorar</Link></li>
                <li><Link to="/perfis">Perfis</Link></li>
                <li><Link to="/conexao">Conexões</Link></li>
                <li><Link to="/FaleConosco">Fale Conosco</Link></li>

                {tipoUsuario === "admin" && (
                    <li>
                        <Link
                            to="/admin"
                            className="nav-link-admin"
                            aria-label="Abrir painel administrativo"
                        >
                            Administração
                        </Link>
                    </li>
                )}
            </ul>

            <div className="nav-actions">
                <input
                    type="text"
                    placeholder="Pesquisar..."
                    className="search"
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    onKeyDown={realizarPesquisa}
                    aria-label="Pesquisar perfis"
                />

                {tipoUsuario ? (
                    <Link to={rotaPerfil} className="perfil-btn">
                        <span className="perfil-btn-avatar">
                            {foto && tipoUsuario !== "admin" ? (
                                <img
                                    src={foto}
                                    alt=""
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : null}

                            {(!foto || tipoUsuario === "admin") && (
                                <span>{inicial}</span>
                            )}
                        </span>

                        <span className="perfil-btn-texto">
                            <span className="perfil-btn-legenda">
                                {tipoUsuario === "admin"
                                    ? "Área administrativa"
                                    : "Minha conta"}
                            </span>
                            <strong>{username}</strong>
                        </span>

                        <span className="perfil-btn-seta" aria-hidden="true">
                            ›
                        </span>
                    </Link>
                ) : (
                    <>
                        <Link to="/cadastro" className="cadastro-btn">
                            Cadastro
                        </Link>

                        <Link to="/login" className="login-btn">
                            Login
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
