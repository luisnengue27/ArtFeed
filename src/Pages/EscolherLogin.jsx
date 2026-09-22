import { Link } from "react-router-dom";

const EscolherLogin = () => {
    return (
        <div>
            <h1>Login</h1>

            <p>Escolha como deseja entrar:</p>

            <div>
                <Link to="/login">
                    <button>
                        Entrar como Artista
                    </button>
                </Link>

                <Link to="/login/cliente">
                    <button>
                        Entrar como Cliente
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default EscolherLogin;