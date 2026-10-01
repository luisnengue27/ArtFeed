import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../NavBar/NavBar.css";

const Navbar = () => {
    const [usuarioLogado, setUsuarioLogado] = useState(false);

    useEffect(() => {
        const verificarLogin = () => {
            const tokenArtista = localStorage.getItem("token");
            const tokenCliente = localStorage.getItem("tokenCliente");

            setUsuarioLogado(!!(tokenArtista || tokenCliente));
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

   const tokenArtista = localStorage.getItem("token");
const tokenCliente = localStorage.getItem("tokenCliente");

const clienteSalvo = localStorage.getItem("cliente");
const artistaSalvo = localStorage.getItem("artista");

    return (
        <nav className="navbar">
            <h2 className="logo">ArtFeed</h2>

            <ul className="nav-links">
                <li><Link to="/">Início</Link></li>
                <li><Link to="/explorar">Explorar</Link></li>
                <li><Link to="/perfis">Perfis</Link></li>
                <li><Link to="/conexao">Conexões</Link></li>
                <li><Link to="/Faleconosco">Fale Conosco</Link></li>
            </ul>

            <div className="nav-actions">

                <input
                    type="text"
                    placeholder="Pesquisar..."
                    className="search"
                />

                {usuarioLogado ? (
         <Link
    to={
        tokenCliente
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