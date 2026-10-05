import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../NavBar/NavBar.css";

const Navbar = () => {
    const [tipoUsuario, setTipoUsuario] = useState("");
    const [pesquisa, setPesquisa] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const verificarLogin = () => {
            const tokenArtista = localStorage.getItem("token");
            const tokenCliente = localStorage.getItem("tokenCliente");

            if (tokenCliente) {
                setTipoUsuario("cliente");
            } else if (tokenArtista) {
                setTipoUsuario("artista");
            } else {
                setTipoUsuario(null);
            }
        };
const realizarPesquisa = (e) => {
    if (e.key === "Enter") {
        const termo = pesquisa.trim();

        if (!termo) return;

        navigate(`/perfis?busca=${encodeURIComponent(termo)}`);
    }
};
        verificarLogin();

        window.addEventListener("loginStatusChanged", verificarLogin);

        return () => {
            window.removeEventListener(
                "loginStatusChanged",
                verificarLogin
            );
        };
    }, []);

    return (
        <nav className="navbar">
            <h2 className="logo">ArtFeed</h2>

            <ul className="nav-links">
                <li>
                    <Link to="/">Início</Link>
                </li>

                <li>
                    <Link to="/explorar">Explorar</Link>
                </li>

                <li>
                    <Link to="/perfis">Perfis</Link>
                </li>

                <li>
                    <Link to="/conexao">Conexões</Link>
                </li>

                <li>
                    <Link to="/FaleConosco">Fale Conosco</Link>
                </li>
            </ul>

            <div className="nav-actions">

               <input
    type="text"
    placeholder="Pesquisar..."
    className="search"
    value={pesquisa}
    onChange={(e) => setPesquisa(e.target.value)}
    onKeyDown={realizarPesquisa}
/>

                {tipoUsuario ? (
                    <Link
                        to={
                            tipoUsuario === "cliente"
                                ? "/perfil-cliente"
                                : "/perfil-artista"
                        }
                        className="perfil-btn"
                    >
                        Meu Perfil
                    </Link>
                ) : (
                    <>
                        <Link
                            to="/cadastro"
                            className="cadastro-btn"
                        >
                            Cadastro
                        </Link>

                        <Link
                            to="/login"
                            className="login-btn"
                        >
                            Login
                        </Link>
                    </>
                )}

            </div>
        </nav>
    );
};

export default Navbar;