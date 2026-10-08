import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

function GerenciarPortfolio() {
    const navigate = useNavigate();

    const [artes, setArtes] = useState([]);
    const [tituloArte, setTituloArte] = useState("");
    const [imagemArte, setImagemArte] = useState(null);
    const [previewArte, setPreviewArte] = useState(null);
    const [imagemSelecionada, setImagemSelecionada] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");
    const [adicionandoArte, setAdicionandoArte] = useState(false);

    const handleExcluirArte = async (arteId) => {
        const confirmar = window.confirm(
            "Tem certeza que deseja excluir esta arte?"
        );

        if (!confirmar) {
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            setErro("Você precisa estar logado.");
            return;
        }

        try {
            const resposta = await apiFetch(
                `/api/artistas/artes/${arteId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                setErro(resultado.erro);
                return;
            }

            setMensagem(resultado.mensagem);
            setErro("");

            carregarArtes();

        } catch (erro) {
            console.error(erro);

            setErro(
                "Não foi possível excluir a arte."
            );
        }
    };
    const carregarArtes = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const resposta = await apiFetch(
                "/api/artistas/minhas-artes",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                setErro(resultado.erro);
                return;
            }

            setArtes(resultado);

        } catch (erro) {
            console.error(erro);
            setErro("Não foi possível carregar suas artes.");
        }
    };

    useEffect(() => {
        carregarArtes();
    }, []);

    const handleAdicionarArte = async (e) => {
        e.preventDefault();

        setMensagem("");
        setErro("");

        const token = localStorage.getItem("token");

        if (!token) {
            setErro("Você precisa estar logado.");
            return;
        }

        if (!imagemArte) {
            setErro("Escolha uma imagem para a arte.");
            return;
        }

        const dados = new FormData();

        dados.append("titulo", tituloArte);
        dados.append("imagem", imagemArte);

        setAdicionandoArte(true);

        try {
            const resposta = await apiFetch(
                "/api/artistas/artes",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: dados
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                setErro(resultado.erro);
                return;
            }

            setMensagem(resultado.mensagem);

            setTituloArte("");
            setImagemArte(null);

            const input = document.getElementById("imagemArte");

            if (input) {
                input.value = "";
            }

            carregarArtes();

        } catch (erro) {
            console.error(erro);
            setErro("Não foi possível adicionar a arte.");

        } finally {
            setAdicionandoArte(false);
        }
    };

    return (
    <div
        style={{
            minHeight: "100vh",
            background: "#000000",
            padding: "40px 20px",
            boxSizing: "border-box"
        }}
    >
        <div
            style={{
                maxWidth: "1100px",
                margin: "0 auto"
            }}
        >
{/* VOLTAR */}
<button
    type="button"
    onClick={() => navigate("/perfil-artista")}
    style={{
        background: "transparent",
        border: "none",
        padding: 0,
        fontSize: "16px",
        cursor: "pointer",
        marginBottom: "25px",
        color: "#ffffff"
    }}
>
    ← Voltar para meu perfil
</button>
            {/* VOLTAR */}
            <button
                onClick={() => navigate("/perfil-artista")}
                style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "16px",
                    cursor: "pointer",
                    marginBottom: "25px"
                }}
            >
                ← Voltar para meu perfil
            </button>

            {/* TÍTULO */}
            <div style={{ marginBottom: "30px" }}>
                <h1
                    style={{
                        margin: 0,
                        fontSize: "32px"
                    }}
                >
                    Gerenciar meu portfólio
                </h1>

                <p
                    style={{
                        marginTop: "8px",
                        color: "#666"
                    }}
                >
                    Adicione e organize suas artes.
                </p>
            </div>

            {/* FORMULÁRIO */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "25px",
                    marginBottom: "40px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
                }}
            >
                <h2 style={{ marginTop: 0 }}>
                    Adicionar nova arte
                </h2>

                <form onSubmit={handleAdicionarArte}>

                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "7px",
                                fontWeight: "600"
                            }}
                        >
                            Título da arte
                        </label>

                        <input
                            type="text"
                            value={tituloArte}
                            onChange={(e) =>
                                setTituloArte(e.target.value)
                            }
                            placeholder="Digite o título da arte"
                            style={{
                                width: "100%",
                                padding: "11px",
                                border: "1px solid #ccc",
                                borderRadius: "7px",
                                boxSizing: "border-box",
                                fontSize: "15px"
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "7px",
                                fontWeight: "600"
                            }}
                        >
                            Imagem
                        </label>

                      <input
    id="imagemArte"
    type="file"
    accept="image/*"
    onChange={(e) => {
        const arquivo = e.target.files[0];

        if (!arquivo) {
            setImagemArte(null);
            setPreviewArte(null);
            return;
        }

        setImagemArte(arquivo);

        const imagem = URL.createObjectURL(arquivo);

        setPreviewArte(imagem);
    }}
/>
{previewArte && (
    <div
        style={{
            marginTop: "20px"
        }}
    >
        <p
            style={{
                fontWeight: "600",
                marginBottom: "10px"
            }}
        >
            Prévia da arte
        </p>

        <img
            src={previewArte}
            alt="Prévia da arte"
            style={{
                width: "220px",
                height: "220px",
                objectFit: "cover",
                borderRadius: "10px",
                display: "block"
            }}
        />
    </div>
)}
                    </div>

                    <button
                        type="submit"
                        disabled={adicionandoArte}
                        style={{
                            padding: "11px 20px",
                            border: "none",
                            borderRadius: "7px",
                            cursor: adicionandoArte
                                ? "default"
                                : "pointer",
                            fontSize: "15px",
                            fontWeight: "600"
                        }}
                    >
                        {adicionandoArte
                            ? "Adicionando..."
                            : "Adicionar arte"}
                    </button>

                </form>

                {mensagem && (
                    <p
                        style={{
                            marginTop: "15px"
                        }}
                    >
                        {mensagem}
                    </p>
                )}

                {erro && (
                    <p
                        style={{
                            marginTop: "15px"
                        }}
                    >
                        {erro}
                    </p>
                )}
            </div>

            {/* GALERIA */}
            <div>

                <h2 style={{ marginBottom: "20px" }}>
                    Minhas artes
                </h2>

                {artes.length === 0 ? (

                    <div
                        style={{
                            background: "#0a0101",
                            padding: "40px",
                            borderRadius: "12px",
                            textAlign: "center",
                            color: "#666"
                        }}
                    >
                        <p>
                            Você ainda não possui artes no portfólio.
                        </p>

                        <p>
                            Adicione sua primeira arte acima.
                        </p>
                    </div>

                ) : (

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: "25px"
                        }}
                    >

                        {artes.map((arte) => (

                            <div
                                key={arte.id}
                                style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    boxShadow:
                                        "0 2px 10px rgba(0,0,0,0.08)"
                                }}
                            >

                               <img
    src={arte.imagem}
    alt={arte.titulo}
    onClick={() => setImagemSelecionada(arte.imagem)}
    style={{
        width: "100%",
        height: "220px",
        objectFit: "cover",
        cursor: "pointer"
    }}
/>

                                <div
                                    style={{
                                        padding: "15px"
                                    }}
                                >

                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: "17px"
                                        }}
                                    >
                                        {arte.titulo ||
                                            "Sem título"}
                                    </h3>
<button
    type="button"
    onClick={() => handleExcluirArte(arte.id)}
    style={{
        marginTop: "12px",
        width: "100%",
        padding: "9px",
        border: "none",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    }}
>
    Excluir arte
</button>
                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>
{imagemSelecionada && (
    <div
        onClick={() => setImagemSelecionada(null)}
        style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "pointer"
        }}
    >
        <button
            type="button"
            onClick={() => setImagemSelecionada(null)}
            style={{
                position: "absolute",
                top: "20px",
                right: "30px",
                background: "none",
                border: "none",
                color: "white",
                fontSize: "40px",
                cursor: "pointer",
                lineHeight: 1
            }}
        >
            ×
        </button>

        <img
            src={imagemSelecionada}
            alt="Arte ampliada"
            onClick={(e) => e.stopPropagation()}
            style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "8px"
            }}
        />
    </div>
)}
        </div>
    </div>
    
);
}

export default GerenciarPortfolio;