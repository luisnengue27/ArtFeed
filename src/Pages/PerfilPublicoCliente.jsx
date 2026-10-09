
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import styles from "./PerfilPublicoCliente.module.css";

const PerfilPublicoCliente = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cliente, setCliente] = useState(null);
    const [notaSelecionada, setNotaSelecionada] = useState(0);
    const [minhaNota, setMinhaNota] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    const tokenArtista = localStorage.getItem("token");
    const tokenCliente = localStorage.getItem("tokenCliente");

    const carregarPerfil = async () => {
        try {
            const token = tokenArtista || tokenCliente;

            if (!token) {
                navigate("/login");
                return;
            }

            const resposta = await apiFetch(`/api/clientes/publico/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || "Não foi possível carregar o perfil.");
            }

            setCliente(dados);
            
            if (tokenArtista) {
                const respostaAvaliacao = await apiFetch(
                    `/api/clientes/publico/${id}/minha-avaliacao`,
                    {
                        headers: {
                            Authorization: `Bearer ${tokenArtista}`
                        }
                    }
                );

                if (respostaAvaliacao.ok) {
                    const dadosAvaliacao = await respostaAvaliacao.json();
                    setMinhaNota(dadosAvaliacao.nota);
                    setNotaSelecionada(dadosAvaliacao.nota);
                }
            }
        } catch (e) {
            setErro(e.message || "Erro ao carregar perfil.");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarPerfil();
    }, [id]);

    const enviarAvaliacao = async () => {
        if (!tokenArtista) {
            setErro("Somente artistas podem avaliar clientes.");
            return;
        }

        if (notaSelecionada < 1 || notaSelecionada > 5) {
            setErro("Selecione uma nota de 1 a 5 estrelas.");
            return;
        }

        try {
            setEnviando(true);
            setErro("");
            setMensagem("");

            const resposta = await apiFetch(
                `/api/clientes/publico/${id}/avaliacao`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${tokenArtista}`
                    },
                    body: JSON.stringify({ nota: notaSelecionada })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || "Não foi possível enviar a avaliação.");
            }

            setCliente((atual) => ({
                ...atual,
                media_avaliacoes: dados.media_avaliacoes,
                quantidade_avaliacoes: dados.quantidade_avaliacoes
            }));

            setMinhaNota(notaSelecionada);
            setMensagem("Avaliação salva com sucesso!");
        } catch (e) {
            setErro(e.message || "Erro ao enviar avaliação.");
        } finally {
            setEnviando(false);
        }
    };

    if (carregando) {
        return <main className={styles.pagina}><p>Carregando perfil...</p></main>;
    }

    if (erro && !cliente) {
        return (
            <main className={styles.pagina}>
                <p>{erro}</p>
                <button onClick={() => navigate(-1)}>Voltar</button>
            </main>
        );
    }

    if (!cliente) return null;

    return (
        <main className={styles.pagina}>
            <button className={styles.voltar} onClick={() => navigate(-1)}>
                ← Voltar
            </button>

            <section className={styles.perfil}>
           ```jsx
<img
    className={styles.foto}
    src={cliente.foto || "/avatar-padrao.png"}
    alt={`Foto de ${cliente.username}`}
    onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/avatar-padrao.png";
    }}
/>
```


                <h1>{cliente.username}</h1>

                <p className={styles.data}>
                    No ArtFeed desde{" "}
                    {cliente.data_cadastro
                        ? new Date(cliente.data_cadastro).toLocaleDateString("pt-BR")
                        : "data indisponível"}
                </p>

                <div className={styles.avaliacoes}>
                    <div className={styles.estrelas}>
                        {"★".repeat(Math.round(cliente.media_avaliacoes || 0))}
                        {"☆".repeat(5 - Math.round(cliente.media_avaliacoes || 0))}
                    </div>

                    <p>
                        {Number(cliente.media_avaliacoes || 0).toFixed(1)} de 5
                        {" · "}
                        {cliente.quantidade_avaliacoes || 0} avaliações
                    </p>
                </div>

                {tokenArtista && (
                    <div className={styles.avaliar}>
                        <h2>Avaliar confiabilidade</h2>
                        <p>Sua avaliação só pode ser feita após uma conversa com este cliente.</p>

                        <div className={styles.seletorEstrelas}>
                            {[1, 2, 3, 4, 5].map((nota) => (
                                <button
                                    key={nota}
                                    type="button"
                                    className={nota <= notaSelecionada ? styles.selecionada : ""}
                                    onClick={() => setNotaSelecionada(nota)}
                                    aria-label={`${nota} estrela${nota > 1 ? "s" : ""}`}
                                    disabled={enviando}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <button
                            className={styles.salvar}
                            onClick={enviarAvaliacao}
                            disabled={enviando || notaSelecionada === 0}
                        >
                            {enviando ? "Salvando..." : "Salvar avaliação"}
                        </button>

                        {minhaNota > 0 && (
                            <p>Sua avaliação atual: {minhaNota} de 5 estrelas.</p>
                        )}
                    </div>
                )}

                {erro && <p className={styles.erro}>{erro}</p>}
                {mensagem && <p className={styles.sucesso}>{mensagem}</p>}
            </section>
        </main>
    );
};

export default PerfilPublicoCliente;