
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import "./ArtistasBloqueados.css";

function ArtistasBloqueados() {
    const navigate = useNavigate();

    const [artistas, setArtistas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [desbloqueando, setDesbloqueando] = useState(null);

    const [artistaDenuncia, setArtistaDenuncia] = useState(null);
    const [motivo, setMotivo] = useState("");
    const [imagens, setImagens] = useState([]);
    const [enviandoDenuncia, setEnviandoDenuncia] = useState(false);

    useEffect(() => {
        const token =
            localStorage.getItem("tokenCliente") ||
            localStorage.getItem("token");

        if (!token) {
            navigate("/");
            return;
        }

        async function carregarBloqueados() {
            try {
                const resposta = await apiFetch("/api/artistas/bloqueados", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível carregar os bloqueados."
                    );
                }

                setArtistas(dados);
            } catch (erro) {
                setErro(erro.message || "Erro ao carregar artistas bloqueados.");
            } finally {
                setCarregando(false);
            }
        }

        carregarBloqueados();
    }, [navigate]);

    async function desbloquearArtista(artista) {
        const confirmar = window.confirm(
            `Deseja desbloquear @${artista.username}?`
        );

        if (!confirmar) return;

        setDesbloqueando(artista.id);
        setErro("");
        setMensagem("");

        try {
            const resposta = await apiFetch(
                `/api/artistas/bloqueados/${artista.id}`,
                { method: "DELETE" }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível desbloquear o artista."
                );
            }

            setArtistas((atuais) =>
                atuais.filter((item) => item.id !== artista.id)
            );

            setMensagem(`@${artista.username} foi desbloqueado.`);
        } catch (erro) {
            setErro(erro.message || "Erro ao desbloquear artista.");
        } finally {
            setDesbloqueando(null);
        }
    }

    function abrirDenuncia(artista) {
        setArtistaDenuncia(artista);
        setMotivo("");
        setImagens([]);
        setErro("");
        setMensagem("");
    }

    async function enviarDenuncia(evento) {
        evento.preventDefault();

        if (!artistaDenuncia || !motivo.trim()) {
            setErro("Informe o motivo da denúncia.");
            return;
        }

        if (imagens.length > 5) {
            setErro("Você pode anexar no máximo 5 imagens.");
            return;
        }

        setEnviandoDenuncia(true);
        setErro("");
        setMensagem("");

        try {
            const formulario = new FormData();
            formulario.append("motivo", motivo.trim());

            imagens.forEach((imagem) => {
                formulario.append("imagens", imagem);
            });

            const resposta = await apiFetch(
                `/api/artistas/${artistaDenuncia.id}/denunciar`,
                {
                    method: "POST",
                    body: formulario,
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível enviar a denúncia."
                );
            }

            setArtistaDenuncia(null);
            setMotivo("");
            setImagens([]);
            setMensagem(
                `Denúncia de @${artistaDenuncia.username} enviada com sucesso.`
            );
        } catch (erro) {
            setErro(erro.message || "Erro ao enviar denúncia.");
        } finally {
            setEnviandoDenuncia(false);
        }
    }

    return (
        <main className="bloqueados-pagina">
            <div className="bloqueados-container">
                <header className="bloqueados-header">
                    <button
                        type="button"
                        className="bloqueados-voltar"
                        onClick={() => navigate(-1)}
                    >
                        ← Voltar
                    </button>

                    <span className="bloqueados-etiqueta">
                        PRIVACIDADE
                    </span>

                    <h1>Artistas bloqueados</h1>

                    <p>
                        Gerencie as contas que você bloqueou no ArtFeed.
                        Você pode desbloquear um artista ou enviar uma denúncia.
                    </p>
                </header>

                {mensagem && (
                    <p className="bloqueados-mensagem" role="status">
                        {mensagem}
                    </p>
                )}

                {erro && (
                    <p className="bloqueados-erro" role="alert">
                        {erro}
                    </p>
                )}

                {carregando ? (
                    <p className="bloqueados-status">
                        Carregando artistas bloqueados...
                    </p>
                ) : artistas.length === 0 ? (
                    <section className="bloqueados-vazio">
                        <span aria-hidden="true">♡</span>
                        <h2>Nenhum artista bloqueado</h2>
                        <p>
                            Quando você bloquear um artista, ele aparecerá nesta lista.
                        </p>
                    </section>
                ) : (
                    <section className="bloqueados-lista">
                        {artistas.map((artista) => (
                            <article
                                className="bloqueados-card"
                                key={artista.id}
                            >
                                <img
                                    className="bloqueados-foto"
                                    src={artista.foto || "/avatar-padrao.png"}
                                    alt={`Foto de ${artista.username}`}
                                    onError={(evento) => {
                                        evento.currentTarget.onerror = null;
                                        evento.currentTarget.src =
                                            "/avatar-padrao.png";
                                    }}
                                />

                                <div className="bloqueados-info">
                                    <h2>
                                        {artista.nome || artista.username}
                                    </h2>

                                    <p className="bloqueados-username">
                                        @{artista.username}
                                    </p>

                                    {artista.profissao && (
                                        <p>{artista.profissao}</p>
                                    )}

                                    {artista.cidade && (
                                        <p>{artista.cidade}</p>
                                    )}

                                    {artista.data_bloqueio && (
                                        <small>
                                            Bloqueado em{" "}
                                            {new Date(
                                                artista.data_bloqueio
                                            ).toLocaleDateString("pt-BR")}
                                        </small>
                                    )}
                                </div>

                                <div className="bloqueados-acoes">
                                    <button
                                        type="button"
                                        className="bloqueados-botao-desbloquear"
                                        onClick={() =>
                                            desbloquearArtista(artista)
                                        }
                                        disabled={desbloqueando !== null}
                                    >
                                        {desbloqueando === artista.id
                                            ? "Desbloqueando..."
                                            : "Desbloquear"}
                                    </button>

                                    <button
                                        type="button"
                                        className="bloqueados-botao-denunciar"
                                        onClick={() => abrirDenuncia(artista)}
                                        disabled={desbloqueando !== null}
                                    >
                                        Denunciar
                                    </button>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>

            {artistaDenuncia && (
                <div
                    className="bloqueados-modal-fundo"
                    onMouseDown={(evento) => {
                        if (evento.target === evento.currentTarget) {
                            setArtistaDenuncia(null);
                        }
                    }}
                >
                    <section
                        className="bloqueados-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-denuncia-bloqueados"
                    >
                        <button
                            type="button"
                            className="bloqueados-modal-fechar"
                            onClick={() => setArtistaDenuncia(null)}
                            aria-label="Fechar denúncia"
                        >
                            ×
                        </button>

                        <h2 id="titulo-denuncia-bloqueados">
                            Denunciar artista
                        </h2>

                        <p>
                            Conta: <strong>@{artistaDenuncia.username}</strong>
                        </p>

                        <form onSubmit={enviarDenuncia}>
                            <label htmlFor="motivo-denuncia-bloqueados">
                                Explique o motivo da denúncia
                            </label>

                            <textarea
                                id="motivo-denuncia-bloqueados"
                                value={motivo}
                                onChange={(evento) =>
                                    setMotivo(evento.target.value)
                                }
                                placeholder="Descreva o que aconteceu..."
                                rows={5}
                                maxLength={5000}
                                required
                            />

                            <label htmlFor="imagens-denuncia-bloqueados">
                                Imagens como evidência (opcional)
                            </label>

                            <input
                                id="imagens-denuncia-bloqueados"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(evento) => {
                                    const arquivos = Array.from(
                                        evento.target.files || []
                                    );

                                    if (arquivos.length > 5) {
                                        setErro(
                                            "Selecione no máximo 5 imagens."
                                        );
                                        evento.target.value = "";
                                        setImagens([]);
                                        return;
                                    }

                                    if (
                                        arquivos.some(
                                            (arquivo) =>
                                                !arquivo.type.startsWith("image/")
                                        )
                                    ) {
                                        setErro(
                                            "Todos os anexos precisam ser imagens."
                                        );
                                        evento.target.value = "";
                                        setImagens([]);
                                        return;
                                    }

                                    setErro("");
                                    setImagens(arquivos);
                                }}
                            />

                            <small>
                                Você pode selecionar até 5 imagens.
                            </small>

                            <div className="bloqueados-modal-acoes">
                                <button
                                    type="button"
                                    onClick={() => setArtistaDenuncia(null)}
                                    disabled={enviandoDenuncia}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={enviandoDenuncia}
                                >
                                    {enviandoDenuncia
                                        ? "Enviando..."
                                        : "Enviar denúncia"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}

export default ArtistasBloqueados;
