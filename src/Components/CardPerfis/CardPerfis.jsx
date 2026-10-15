import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import styles from "./CardPerfis.module.css";
import { apiFetch } from "../../services/api";
import { Link } from "react-router-dom";

const CardPerfis = ({
    id,
    nome,
    profissao,
    imagem,
    preco,
    cidade,
    descricao,
    tags,
    avaliacao,
    numavaliacao
}) => {
    const [seguindo, setSeguindo] = useState(false);
    const [erroSeguir, setErroSeguir] = useState("");
    const [quantidadeSeguidores, setQuantidadeSeguidores] = useState(0);

    const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);
    const [notaSelecionada, setNotaSelecionada] = useState(0);
    const [mensagemAvaliacao, setMensagemAvaliacao] = useState("");
    const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

    const [mediaAtual, setMediaAtual] = useState(Number(avaliacao) || 0);
    const [totalAvaliacoes, setTotalAvaliacoes] = useState(
        Number(String(numavaliacao || 0).replace(/[^\d]/g, "")) || 0
    );

    const [mostrarMenu, setMostrarMenu] = useState(false);
    const [mostrarDenuncia, setMostrarDenuncia] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [imagensDenuncia, setImagensDenuncia] = useState([]);
    const [mensagemModeracao, setMensagemModeracao] = useState("");
    const [enviandoModeracao, setEnviandoModeracao] = useState(false);
    const [bloqueado, setBloqueado] = useState(false);

    const listaTags = Array.isArray(tags)
        ? tags
        : String(tags || "")
              .split(",")
              .map(tag => tag.trim())
              .filter(Boolean);

    const obterToken = () =>
        localStorage.getItem("tokenCliente") ||
        localStorage.getItem("token");

    useEffect(() => {
        const buscarDados = async () => {
            try {
                const respostaSeguidores = await apiFetch(
                    `/api/artistas/${id}/seguidores`
                );

                const dadosSeguidores = await respostaSeguidores.json();

                if (respostaSeguidores.ok) {
                    setQuantidadeSeguidores(
                        Number(dadosSeguidores.seguidores) || 0
                    );
                }

                const token = obterToken();
                if (!token) return;

                const respostaSeguindo = await apiFetch(
                    `/api/artistas/${id}/seguindo`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const dadosSeguindo = await respostaSeguindo.json();

                if (respostaSeguindo.ok) {
                    setSeguindo(dadosSeguindo.seguindo);
                }
            } catch (erro) {
                console.error("Erro ao carregar dados do artista:", erro);
            }
        };

        buscarDados();
    }, [id]);

    const handleSeguir = async () => {
        const token = obterToken();

        if (!token) {
            setErroSeguir("Você precisa estar logado para seguir artistas.");
            return;
        }

        try {
            const resposta = await apiFetch(
                `/api/artistas/${id}/seguir`,
                {
                    method: seguindo ? "DELETE" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setErroSeguir(dados.erro || "Não foi possível atualizar.");
                return;
            }

            setSeguindo(!seguindo);
            setErroSeguir("");

            setQuantidadeSeguidores(atual =>
                Math.max(0, atual + (seguindo ? -1 : 1))
            );
        } catch (erro) {
            console.error(erro);
            setErroSeguir("Não foi possível conectar com o servidor.");
        }
    };

    const handleAvaliar = async () => {
        const token = obterToken();

        if (!token) {
            setMensagemAvaliacao("Entre na sua conta para avaliar este artista.");
            return;
        }

        if (!notaSelecionada) {
            setMensagemAvaliacao("Selecione de 1 a 5 estrelas.");
            return;
        }

        setEnviandoAvaliacao(true);
        setMensagemAvaliacao("");

        try {
            const resposta = await apiFetch(
                `/api/artistas/${id}/avaliar`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ nota: notaSelecionada })
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                setMensagemAvaliacao(
                    resultado.erro || "Não foi possível registrar a avaliação."
                );
                return;
            }

            setMediaAtual(Number(resultado.avaliacao) || 0);
            setTotalAvaliacoes(Number(resultado.numavaliacao) || 0);
            setMensagemAvaliacao("Avaliação registrada com sucesso!");
            setMostrarAvaliacao(false);
            setNotaSelecionada(0);
        } catch (erro) {
            console.error("Erro ao avaliar artista:", erro);
            setMensagemAvaliacao("Não foi possível conectar com o servidor.");
        } finally {
            setEnviandoAvaliacao(false);
        }
    };

    const handleBloquear = async () => {
        const token = obterToken();

        if (!token) {
            setMensagemModeracao("Entre na sua conta para bloquear artistas.");
            setMostrarMenu(false);
            return;
        }

        const confirmar = window.confirm(
            `Deseja realmente bloquear ${nome}? O perfil e as artes deste artista deixarão de aparecer para você.`
        );

        if (!confirmar) return;

        setEnviandoModeracao(true);
        setMensagemModeracao("");

        try {
            const resposta = await apiFetch(
                `/api/artistas/${id}/bloquear`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagemModeracao(
                    dados.erro || "Não foi possível bloquear este artista."
                );
                return;
            }

            setBloqueado(true);
        } catch (erro) {
            console.error("Erro ao bloquear artista:", erro);
            setMensagemModeracao("Não foi possível conectar com o servidor.");
        } finally {
            setEnviandoModeracao(false);
            setMostrarMenu(false);
        }
    };

    const handleDenunciar = async (evento) => {
        evento.preventDefault();

        const token = obterToken();

        if (!token) {
            setMensagemModeracao("Entre na sua conta para denunciar artistas.");
            setMostrarDenuncia(false);
            return;
        }

        if (!motivo.trim()) {
            setMensagemModeracao("Descreva o motivo da denúncia.");
            return;
        }

        if (imagensDenuncia.length > 5) {
            setMensagemModeracao("Você pode anexar no máximo 5 imagens.");
            return;
        }

        setEnviandoModeracao(true);
        setMensagemModeracao("");

        try {
            const formulario = new FormData();
            formulario.append("motivo", motivo.trim());

            imagensDenuncia.forEach(arquivo => {
                formulario.append("imagens", arquivo);
            });

            const resposta = await apiFetch(
                `/api/artistas/${id}/denunciar`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formulario
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagemModeracao(
                    dados.erro || "Não foi possível enviar a denúncia."
                );
                return;
            }

            setMensagemModeracao("Denúncia enviada com sucesso!");
            setMotivo("");
            setImagensDenuncia([]);
            setMostrarDenuncia(false);
        } catch (erro) {
            console.error("Erro ao denunciar artista:", erro);
            setMensagemModeracao("Não foi possível conectar com o servidor.");
        } finally {
            setEnviandoModeracao(false);
        }
    };

    if (bloqueado) return null;

 return (
    <>
        <div className={styles["card-artista"]}>
            <div className={styles.destaque}>⚡ Destaque</div>

            <div className={styles["card-topo"]}>
                <img
                    src={imagem}
                    alt={`Foto de ${nome}`}
                    className={styles["foto-artista"]}
                />

                <div className={styles["informacoes-artista"]}>
                    <h2>{nome}</h2>
                    <p>{profissao}</p>
                </div>

                <button
                    type="button"
                    className={styles["botao-info"]}
                    aria-label={`Opções para ${nome}`}
                    aria-expanded={mostrarMenu}
                    onClick={() => setMostrarMenu(atual => !atual)}
                >
                    ⋮
                </button>

                {mostrarMenu && (
                    <div className={styles["menu-moderacao"]}>
                        <button
                            type="button"
                            onClick={() => {
                                setMostrarMenu(false);
                                setMensagemModeracao("");
                                setMostrarDenuncia(true);
                            }}
                        >
                            Denunciar
                        </button>

                        <button
                            type="button"
                            disabled={enviandoModeracao}
                            onClick={handleBloquear}
                        >
                            Bloquear
                        </button>
                    </div>
                )}

                <span className={styles.status}>●</span>
            </div>

            <p className={styles.descricao}>{descricao}</p>

            {listaTags.length > 0 && (
                <div className={styles.tags}>
                    {listaTags.map((tag, index) => (
                        <span key={`${tag}-${index}`}>{tag}</span>
                    ))}
                </div>
            )}

            <div className={styles.avaliacao}>
                <span className={styles.estrelas}>
                    {"★".repeat(Math.round(mediaAtual))}
                    {"☆".repeat(5 - Math.round(mediaAtual))}
                </span>
                <span>
                    {mediaAtual.toFixed(1)} ({totalAvaliacoes})
                </span>
            </div>

            <div className={styles["linha-inferior"]}>
                <span className="preco">{preco}</span>
                <span className="seguidores">
                    {quantidadeSeguidores} seguidores
                </span>
            </div>

            <div className={styles.botoes}>
                <Link
                    to={`/perfil-artista/${id}`}
                    className={styles.portfolio}
                >
                    Ver Portfólio
                </Link>

                <button
                    type="button"
                    className="seguir"
                    onClick={handleSeguir}
                >
                    {seguindo ? "Seguindo" : "Seguir"}
                </button>
            </div>

            {erroSeguir && <p role="alert">{erroSeguir}</p>}

            <button
                type="button"
                className={styles.avaliar}
                onClick={() => {
                    setMostrarAvaliacao(atual => !atual);
                    setMensagemAvaliacao("");
                }}
            >
                Avaliar
            </button>

            {mostrarAvaliacao && (
                <div className={styles["formulario-avaliacao"]}>
                    <p>Sua nota para este artista:</p>

                    <div className={styles["estrelas-selecao"]}>
                        {[1, 2, 3, 4, 5].map(nota => (
                            <button
                                key={nota}
                                type="button"
                                aria-label={`${nota} ${
                                    nota === 1 ? "estrela" : "estrelas"
                                }`}
                                aria-pressed={notaSelecionada === nota}
                                onClick={() => setNotaSelecionada(nota)}
                                disabled={enviandoAvaliacao}
                            >
                                {nota <= notaSelecionada ? "★" : "☆"}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className={styles["enviar-avaliacao"]}
                        onClick={handleAvaliar}
                        disabled={enviandoAvaliacao}
                    >
                        {enviandoAvaliacao
                            ? "Enviando..."
                            : "Enviar avaliação"}
                    </button>
                </div>
            )}

            {mensagemAvaliacao && (
                <p role="status" className={styles["mensagem-avaliacao"]}>
                    {mensagemAvaliacao}
                </p>
            )}

            {mensagemModeracao && (
                <p role="status" className={styles["mensagem-moderacao"]}>
                    {mensagemModeracao}
                </p>
            )}

                  </div>

        {mostrarDenuncia &&
            createPortal(
                <div className={styles["fundo-modal"]}>
                    <form
                        className={styles["modal-denuncia"]}
                        onSubmit={handleDenunciar}
                    >
                        <h3>Denunciar {nome}</h3>

                        <label htmlFor={`motivo-denuncia-${id}`}>
                            Por que deseja denunciar este artista?
                        </label>

                        <textarea
                            id={`motivo-denuncia-${id}`}
                            value={motivo}
                            onChange={evento => setMotivo(evento.target.value)}
                            placeholder="Descreva o que aconteceu..."
                            required
                            rows={5}
                        />

                        <label htmlFor={`imagens-denuncia-${id}`}>
                            Imagens de comprovação (opcional, até 5)
                        </label>

                        <input
                            id={`imagens-denuncia-${id}`}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={evento => {
                                const arquivos = Array.from(
                                    evento.target.files || []
                                );

                                if (arquivos.length > 5) {
                                    setMensagemModeracao(
                                        "Selecione no máximo 5 imagens."
                                    );
                                    setImagensDenuncia([]);
                                    evento.target.value = "";
                                    return;
                                }

                                setMensagemModeracao("");
                                setImagensDenuncia(arquivos);
                            }}
                        />

                        {imagensDenuncia.length > 0 && (
                            <p>
                                {imagensDenuncia.length} imagem(ns) selecionada(s)
                            </p>
                        )}

                        <div className={styles["acoes-denuncia"]}>
                            <button
                                type="button"
                                onClick={() => setMostrarDenuncia(false)}
                                disabled={enviandoModeracao}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={enviandoModeracao}
                            >
                                {enviandoModeracao
                                    ? "Enviando..."
                                    : "Enviar denúncia"}
                            </button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
    </>
);
                 
            
        
    
};

export default CardPerfis;
