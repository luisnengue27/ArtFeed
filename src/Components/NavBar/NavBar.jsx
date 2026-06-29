import { Link } from "react-router-dom";
import "../NavBar/NavBar.css"

const Navbar = () => {
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

        <Link to="/login" className="login-btn">
          Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;