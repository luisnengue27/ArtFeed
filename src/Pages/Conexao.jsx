import "./Conexao.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://artfeed-backend.onrender.com";

const Conexao = () => {
    const navigate = useNavigate();

    const [artistas, setArtistas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [abrindoChat, setAbrindoChat] = useState(null);

    useEffect(() => {
        const buscarSeguidos = async () => {
            const token =
                localStorage.getItem("tokenCliente") ||
                localStorage.getItem("token");

            if (!token) {
                setErro("Faça login para ver suas conexões.");
                setCarregando(false);
                return;
            }

            try {
                const resposta = await fetch(
                    `${API_URL}/api/artistas/meus-seguidos`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível carregar suas conexões."
                    );
                }

                setArtistas(dados);
            } catch (err) {
                setErro(err.message || "Erro ao carregar conexões.");
            } finally {
                setCarregando(false);
            }
        };

        buscarSeguidos();
    }, []);

    const abrirChat = async (artista) => {
        const token =
            localStorage.getItem("tokenCliente") ||
            localStorage.getItem("token");

        if (!token) {
            setErro("Faça login para iniciar uma conversa.");
            return;
        }

        setAbrindoChat(artista.id);
        setErro("");

        try {
            const resposta = await fetch(
                `${API_URL}/api/chat/conversa`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        artista_id: artista.id,
                    }),
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível abrir a conversa."
                );
            }

            if (!dados.id) {
                throw new Error("O servidor não retornou o ID da conversa.");
            }

            navigate(`/chat/conversa/${dados.id}`);
        } catch (err) {
            setErro(err.message || "Erro ao abrir o chat.");
        } finally {
            setAbrindoChat(null);
        }
    };

    return (
        <main className="conexao">
            <h1>Conexões</h1>

            <p>Artistas que você segue</p>

            {carregando && <p>Carregando artistas...</p>}

            {erro && <p role="alert">{erro}</p>}

            {!carregando && !erro && artistas.length === 0 && (
                <p>Você ainda não segue nenhum artista.</p>
            )}

            <section className="lista-conexoes">
                {artistas.map((artista) => (
                    <article
                        className="card-conexao"
                        key={artista.id}
                    >
                        <img
                            src={artista.foto || "/avatar-padrao.png"}
                            alt={`Foto de ${artista.username}`}
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/avatar-padrao.png";
                            }}
                        />

                        <div className="info-conexao">
                            <h2>{artista.nome || artista.username}</h2>
                            <p>@{artista.username}</p>

                            {artista.profissao && (
                                <p>{artista.profissao}</p>
                            )}

                            {artista.cidade && (
                                <p>{artista.cidade}</p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => abrirChat(artista)}
                            disabled={abrindoChat !== null}
                        >
                            {abrindoChat === artista.id
                                ? "Abrindo..."
                                : "Chat"}
                        </button>
                    </article>
                ))}
            </section>

            <section className="acesso-conversas">
                <h2>Suas conversas</h2>

                <p>
                    Veja suas conversas e continue falando com seus contatos.
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/conversas")}
                >
                    Minhas conversas
                </button>
            </section>
        </main>
    );
};

export default Conexao;