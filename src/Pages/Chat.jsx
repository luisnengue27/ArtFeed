import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import styles from "./Chat.module.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://artfeed-backend.onrender.com";
const obterDadosToken = (token) => {
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        return payload;
    } catch (erro) {
        console.error("Erro ao ler token:", erro);
        return null;
    }
};
const Chat = () => {
    const { artistaId } = useParams();
    const navigate = useNavigate();

    const [conversaId, setConversaId] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [texto, setTexto] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);

    // Pega o token do usuário logado
    const pegarToken = () => {
        return (
            localStorage.getItem("tokenCliente") ||
            localStorage.getItem("token")
        );
    };

    // Cria ou recupera a conversa
    useEffect(() => {
        const iniciarChat = async () => {
            try {
                const token = pegarToken();
                console.log("artistaId da URL:", artistaId);
                console.log("token:", token);
const dadosToken = obterDadosToken(token);
console.log("dados do token:", dadosToken);
if (!dadosToken) {
    navigate("/login");
    return;
}
                if (!token) {
                    navigate("/login");
                    return;
                }

                const resposta = await fetch(
                    `${API_URL}/api/chat/conversa`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                      body: JSON.stringify(
    dadosToken.tipo === "artista"
        ? {
            artista_id: Number(artistaId)
        }
        : {
            artista_id: Number(artistaId)
        }
)
                    }
                );

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Erro ao iniciar conversa"
                    );
                }

                setConversaId(dados.id);

            } catch (erro) {
                console.error(
                    "Erro ao iniciar chat:",
                    erro
                );
            } finally {
                setCarregando(false);
            }
        };

        iniciarChat();
    }, [artistaId, navigate]);


    // Busca as mensagens quando temos a conversa
    useEffect(() => {
        if (!conversaId) {
            return;
        }

        const buscarMensagens = async () => {
            try {
                const token = pegarToken();

                const resposta = await fetch(
                    `${API_URL}/api/chat/conversa/${conversaId}/mensagens`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Erro ao buscar mensagens"
                    );
                }

                setMensagens(dados);

            } catch (erro) {
                console.error(
                    "Erro ao buscar mensagens:",
                    erro
                );
            }
        };

        buscarMensagens();
    }, [conversaId]);


    // Enviar mensagem
    const enviarMensagem = async (e) => {
        e.preventDefault();

        if (!texto.trim() || !conversaId || enviando) {
            return;
        }

        try {
            setEnviando(true);

            const token = pegarToken();

            const resposta = await fetch(
                `${API_URL}/api/chat/conversa/${conversaId}/mensagens`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        texto: texto.trim()
                    })
                }
            );

            const mensagem = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    mensagem.erro || "Erro ao enviar mensagem"
                );
            }

            // Adiciona a mensagem imediatamente na tela
            setMensagens((mensagensAtuais) => [
                ...mensagensAtuais,
                mensagem
            ]);

            setTexto("");

        } catch (erro) {
            console.error(
                "Erro ao enviar mensagem:",
                erro
            );
        } finally {
            setEnviando(false);
        }
    };


    if (carregando) {
        return (
            <main className={styles.chat}>
                <p>Carregando chat...</p>
            </main>
        );
    }


    return (
        <main className={styles.chat}>

            <button
                className={styles.voltar}
                onClick={() => navigate(-1)}
            >
                ← Voltar
            </button>

            <section className={styles.container}>

                <header className={styles.header}>
                    <h1>💬 Chat</h1>
                    <p>
                        Conversa com o artista #{artistaId}
                    </p>
                </header>


                <div className={styles.mensagens}>

                    {mensagens.length === 0 ? (

                        <p className={styles.semMensagens}>
                            Nenhuma mensagem ainda.
                        </p>

                    ) : (

                        mensagens.map((mensagem) => (

                            <div
                                key={mensagem.id}
                                className={styles.mensagem}
                            >
                                <strong>
                                    {mensagem.remetente_tipo === "artista"
                                        ? "Artista"
                                        : "Você"}
                                </strong>

                                <p>
                                    {mensagem.texto}
                                </p>

                                <small>
                                    {new Date(
                                        mensagem.data_envio
                                    ).toLocaleString("pt-BR")}
                                </small>
                            </div>

                        ))

                    )}

                </div>


                <form
                    className={styles.inputArea}
                    onSubmit={enviarMensagem}
                >

                    <input
                        type="text"
                        value={texto}
                        onChange={(e) =>
                            setTexto(e.target.value)
                        }
                        placeholder="Digite uma mensagem..."
                        disabled={!conversaId || enviando}
                    />

                    <button
                        type="submit"
                        disabled={!conversaId || enviando}
                    >
                        {enviando ? "..." : "➤"}
                    </button>

                </form>

            </section>

        </main>
    );
};

export default Chat;