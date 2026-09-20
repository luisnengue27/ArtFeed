import { Link } from "react-router-dom";

const Cadastro = () => {
    return (
        <div>
            <h1>Cadastro</h1>

            <p>Escolha o tipo de conta que deseja criar:</p>

            <div>
                <Link to="/cadastro/artista">
                    <button>Cadastrar como Artista</button>
                </Link>

                <Link to="/cadastro/cliente">
                    <button>Cadastrar como Cliente</button>
                </Link>

                <button disabled>
                    Cadastrar como Administrador
                </button>
            </div>
        </div>
    );
};

export default Cadastro;