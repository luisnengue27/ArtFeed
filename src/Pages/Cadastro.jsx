
import { Link } from "react-router-dom";
import "./Cadastro.css";

const Cadastro = () => {
    return (
        <main className="cadastro-pagina">
            <section className="cadastro-conteudo">
                <Link to="/" className="cadastro-logo">
                    <span className="cadastro-logo-icone">✦</span>
                    ArtFeed
                </Link>

                <p className="cadastro-subtitulo">
                    Um espaço para criar, descobrir e compartilhar arte.
                </p>

                <h1>Faça parte da comunidade</h1>

                <p className="cadastro-descricao">
                    Escolha o tipo de conta que combina com você.
                </p>

                <div className="cadastro-opcoes">
                    <Link
                        to="/cadastro/artista"
                        className="cadastro-card cadastro-card-artista"
                    >
                        <span className="cadastro-icone">✎</span>

                        <h2>Sou Artista</h2>

                        <p>
                            Compartilhe suas criações, monte seu portfólio
                            e mostre seu talento para o mundo.
                        </p>

                        <span className="cadastro-card-acao">
                            Criar conta de artista <span>→</span>
                        </span>
                    </Link>

                    <Link
                        to="/cadastro/cliente"
                        className="cadastro-card cadastro-card-cliente"
                    >
                        <span className="cadastro-icone">◇</span>

                        <h2>Sou Cliente</h2>

                        <p>
                            Explore obras, descubra novos talentos e
                            encontre artistas para seus projetos.
                        </p>

                        <span className="cadastro-card-acao">
                            Criar conta de cliente <span>→</span>
                        </span>
                    </Link>
                </div>

                <p className="cadastro-login">
                    Já tem uma conta?{" "}
                    <Link to="/login">Entrar</Link>
                </p>
            </section>

            <Link to="/login/admin" className="cadastro-dev">
                <span>DEV</span>
                <span>Área administrativa</span>
            </Link>
        </main>
    );
};

export default Cadastro;
