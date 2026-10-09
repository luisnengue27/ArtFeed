
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import styles from "./Chat.module.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://artfeed-backend.onrender.com";

const Chat = () => {
    const { conversaId } = useParams();
    const navigate = useNavigate();

    const [mensagens, setMensagens] = useState([]);
    const [texto, setTexto] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [enviandoImagem, setEnviandoImagem] = useState(false);
    const [outroUsuario, setOutroUsuario] = useState(null);

    const inputImagemRef = useRef(null);
const mensagensContainerRef = useRef(null);
const ultimaMensagemIdRef = useRef(null);
    const pegarToken = () =>
        localStorage.getItem("tokenCliente") ||
        localStorage.getItem("token");

useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    const overflowHtmlAnterior = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
        document.body.style.overflow = overflowAnterior;
        document.documentElement.style.overflow = overflowHtmlAnterior;
    };
}, []);

useEffect(() => {
let ativo = true;


const buscarOutroUsuario = async () => {
    try {
        const token = pegarToken();

        if (!token) return;

        const resposta = await fetch(
            `${API_URL}/api/chat/conversa/${conversaId}/detalhes`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Erro ao buscar participante."
            );
        }

        if (ativo) {
            setOutroUsuario(dados);
        }
    } catch (erro) {
        console.error(
            "Erro ao buscar participante da conversa:",
            erro
        );
    }
};

buscarOutroUsuario();

return () => {
    ativo = false;
};


}, [conversaId]);


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

                setMensagens((atuais) => {
                    const unicas = new Map();

                    atuais.forEach((m) =>
                        unicas.set(String(m.id), m)
                    );

                    dados.forEach((m) =>
                        unicas.set(String(m.id), m)
                    );

                    return Array.from(unicas.values()).sort(
                        (a, b) =>
                            new Date(a.data_envio).getTime() -
                            new Date(b.data_envio).getTime()
                    );
                });
            } catch (erro) {
                if (ativo) {
                    console.error("Erro ao buscar mensagens:", erro);
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                    timeoutId = setTimeout(buscarMensagens, 2000);
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
useEffect(() => {
    if (mensagens.length === 0) return;

    const ultimaMensagem = mensagens[mensagens.length - 1];
    const ultimaId = String(ultimaMensagem.id);

    // Só rola quando a última mensagem realmente muda.
    if (ultimaId === ultimaMensagemIdRef.current) return;

    const container = mensagensContainerRef.current;

    if (container) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: ultimaMensagemIdRef.current === null
                ? "auto"
                : "smooth"
        });
    }

    ultimaMensagemIdRef.current = ultimaId;
}, [mensagens]);
    const enviarMensagem = async (e) => {
        e.preventDefault();

        if (!texto.trim() || !conversaId || enviando) return;

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

            setMensagens((atuais) =>
                atuais.some((m) => String(m.id) === String(mensagem.id))
                    ? atuais
                    : [...atuais, mensagem]
            );

            setTexto("");
        } catch (erro) {
            console.error("Erro ao enviar mensagem:", erro);
            alert(erro.message || "Não foi possível enviar a mensagem.");
        } finally {
            setEnviando(false);
        }
    };

    const enviarImagem = async (e) => {
        const arquivo = e.target.files?.[0];

        // Permite selecionar novamente o mesmo arquivo depois.
        e.target.value = "";

        if (!arquivo) return;

        if (!arquivo.type.startsWith("image/")) {
            alert("Selecione um arquivo de imagem.");
            return;
        }

        if (arquivo.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5 MB.");
            return;
        }

        try {
            setEnviandoImagem(true);

            const token = pegarToken();
            const formulario = new FormData();

            formulario.append("imagem", arquivo);

            const resposta = await fetch(
                `${API_URL}/api/chat/conversa/${conversaId}/imagem`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formulario
                }
            );

            const mensagem = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    mensagem.erro || "Erro ao enviar imagem"
                );
            }

            setMensagens((atuais) =>
                atuais.some((m) => String(m.id) === String(mensagem.id))
                    ? atuais
                    : [...atuais, mensagem]
            );
        } catch (erro) {
            console.error("Erro ao enviar imagem:", erro);
            alert(erro.message || "Não foi possível enviar a imagem.");
        } finally {
            setEnviandoImagem(false);
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
    {outroUsuario ? (
        <div className={styles.headerUsuario}>
          
<img
    className={styles.avatarUsuario}
    src={
        outroUsuario.foto
            ? (
                outroUsuario.foto.startsWith("http")
                    ? outroUsuario.foto
                    : `${API_URL}${outroUsuario.foto}`
            )
            : "/avatar-padrao.png"
    }
    alt={`Foto de ${outroUsuario.username}`}
    onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/avatar-padrao.png";
    }}
/>


        {outroUsuario.tipo === "cliente" ? (
            <button
                type="button"
                className={styles.nomeUsuario}
                onClick={() =>
                    navigate(
                        `/perfil-cliente/${outroUsuario.id}`
                    )
                }
            >
                {outroUsuario.username}
            </button>
        ) : (
            <h1>{outroUsuario.username}</h1>
        )}
    </div>
) : (
    <h1>💬 Chat</h1>
)}
```

</header>


           <div
    className={styles.mensagens}
    ref={mensagensContainerRef}
>
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
    @{mensagem.remetente_username || "usuário"}
</strong>

                                {mensagem.texto && (
                                    <p>{mensagem.texto}</p>
                                )}

                                {mensagem.imagem && (
                                    <a
                                        href={mensagem.imagem}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <img
                                            src={mensagem.imagem}
                                            alt="Imagem enviada na conversa"
                                            loading="lazy"
                                        />
                                    </a>
                                )}

                                <small>
                                    {new Date(
                                        mensagem.data_envio
                                    ).toLocaleString("pt-BR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
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
                        ref={inputImagemRef}
                        type="file"
                        accept="image/*"
                        onChange={enviarImagem}
                        style={{ display: "none" }}
                    />

                    <button
                        type="button"
                        title="Enviar imagem"
                        aria-label="Enviar imagem"
                        onClick={() => inputImagemRef.current?.click()}
                        disabled={enviandoImagem}
                    >
                        {enviandoImagem ? "..." : "📷"}
                    </button>

                    <input
                        type="text"
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        disabled={enviando || enviandoImagem}
                    />

                    <button
                        type="submit"
                        disabled={
                            enviando ||
                            enviandoImagem ||
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