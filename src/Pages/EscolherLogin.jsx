
import { Link } from "react-router-dom";
import "./EscolherLogin.css";

const EscolherLogin = () => {
    return (
        <main className="escolher-login-pagina">
            <Link to="/" className="escolher-login-logo">
                <span>✦</span>
                ArtFeed
            </Link>

            <p className="escolher-login-subtitulo">
                Sua comunidade criativa está esperando por você.
            </p>

            <section className="escolher-login-conteudo">
                <h1>Bem-vindo de volta!</h1>

                <p className="escolher-login-descricao">
                    Escolha como deseja entrar na sua conta.
                </p>

                <div className="escolher-login-opcoes">
                    <Link
                        to="/login/artista"
                        className="escolher-login-card escolher-login-artista"
                    >
                        <span className="escolher-login-icone">
                            ✎
                        </span>

                        <h2>Artista</h2>

                        <p>
                            Acesse seu perfil, gerencie seu portfólio
                            e compartilhe suas criações.
                        </p>

                        <span className="escolher-login-acao">
                            Entrar como artista <span>→</span>
                        </span>
                    </Link>

                    <Link
                        to="/login/cliente"
                        className="escolher-login-card escolher-login-cliente"
                    >
                        <span className="escolher-login-icone">
                            ◇
                        </span>

                        <h2>Cliente</h2>

                        <p>
                            Descubra artistas, explore portfólios
                            e acompanhe suas conexões.
                        </p>

                        <span className="escolher-login-acao">
                            Entrar como cliente <span>→</span>
                        </span>
                    </Link>
                </div>

                <p className="escolher-login-cadastro">
                    Ainda não tem uma conta?{" "}
                    <Link to="/cadastro">
                        Cadastre-se
                    </Link>
                </p>
            </section>
        </main>
    );
};

export default EscolherLogin;
