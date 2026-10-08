import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import styles from "./Chat.module.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://artfeed-backend.onrender.com";


const Chat = () => {

    const { conversaId } = useParams();
    console.log("ID DA CONVERSA:", conversaId);
    const navigate = useNavigate();

    const [mensagens, setMensagens] = useState([]);
    const [texto, setTexto] = useState("");

    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);


    const pegarToken = () => {

        return (
            localStorage.getItem("tokenCliente") ||
            localStorage.getItem("token")
        );
    };


    
useEffect(() => {
    let ativo = true;
    let timeoutId;

    const buscarMensagens = async () => {
        try {
            const token = pegarToken();

            if (!token) {
                navigate("/login");
                return;
            }

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

            if (!ativo) return;

            // Atualiza as mensagens sem duplicar as existentes.
            setMensagens((atuais) => {
                const mensagensUnicas = new Map();

                atuais.forEach((mensagem) => {
                    mensagensUnicas.set(
                        String(mensagem.id),
                        mensagem
                    );
                });

                dados.forEach((mensagem) => {
                    mensagensUnicas.set(
                        String(mensagem.id),
                        mensagem
                    );
                });

                return Array.from(mensagensUnicas.values())
                    .sort(
                        (a, b) =>
                            new Date(a.data_envio).getTime() -
                            new Date(b.data_envio).getTime()
                    );
            });

        } catch (erro) {
            if (ativo) {
                console.error(
                    "Erro ao buscar mensagens:",
                    erro
                );
            }
        } finally {
            if (ativo) {
                setCarregando(false);

                // Consulta novamente após 2 segundos.
                timeoutId = setTimeout(
                    buscarMensagens,
                    2000
                );
            }
        }
    };

    setCarregando(true);
    buscarMensagens();

    return () => {
        ativo = false;
        clearTimeout(timeoutId);
    };
}, [conversaId, navigate]);


    const enviarMensagem = async (e) => {

        e.preventDefault();

        if (
            !texto.trim() ||
            !conversaId ||
            enviando
        ) {
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
                    mensagem.erro ||
                    "Erro ao enviar mensagem"
                );
            }


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
                                        : "Cliente"}
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
                        disabled={enviando}
                    />


                    <button
                        type="submit"
                        disabled={
                            enviando ||
                            !texto.trim()
                        }
                    >
                        {enviando ? "..." : "➤"}
                    </button>

                </form>

            </section>

        </main>
    );
};


export default Chat;