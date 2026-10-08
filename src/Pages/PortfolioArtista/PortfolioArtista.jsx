import { useEffect, useState } from "react";
import {
    useParams,
    useNavigate
} from "react-router-dom";

import styles from "./PortfolioArtista.module.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://artfeed-backend.onrender.com";

const PortfolioArtista = () => {

    const { id } = useParams();
    const navigate = useNavigate();
    
const [imagemSelecionada, setImagemSelecionada] = useState(null);
    const [artista, setArtista] = useState(null);
    const [artes, setArtes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {

        const buscarPortfolio = async () => {

            try {

             const tokenCliente =
    localStorage.getItem("tokenCliente");

const tokenArtista =
    localStorage.getItem("token");

const token = tokenCliente || tokenArtista;

if (!token) {
    navigate("/login");
    return;
}

const resposta = await fetch(
    `${API_URL}/api/artistas/portfolio/${id}`,
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

                if (!resposta.ok) {
                    throw new Error("Artista não encontrado");
                }

                const dados = await resposta.json();

                setArtista(dados.artista);
                setArtes(dados.artes);

            } catch (erro) {

                console.error(
                    "Erro ao carregar portfólio:",
                    erro
                );

            } finally {

                setCarregando(false);

            }
        };

        buscarPortfolio();

    }, [id]);


    if (carregando) {
        return (
            <div className={styles.carregando}>
                Carregando portfólio...
            </div>
        );
    }


    if (!artista) {
        return (
            <div className={styles.erro}>
                Artista não encontrado.
            </div>
        );
    }


    return (

        <main className={styles.portfolio}>
<button
    className={styles.botaoVoltar}
    onClick={() => navigate(-1)}
>
    ← Voltar
</button>
            {/* =========================
                INFORMAÇÕES DO ARTISTA
            ========================= */}

            <section className={styles.cabecalho}>

                <div className={styles.fotoContainer}>

                    <img
                        src={artista.foto_perfil}
                        alt={artista.nome}
                        className={styles.foto}
                    />

                </div>


                <div className={styles.informacoes}>

                    <h1>
                        {artista.nome}
                    </h1>

                    <h2>
                        @{artista.username}
                    </h2>

                    <p>
                        <strong>Profissão:</strong>{" "}
                        {artista.profissao}
                    </p>

                    <p>
                        <strong>Cidade:</strong>{" "}
                        {artista.cidade}
                    </p>

                    <p>
                        <strong>Preço:</strong>{" "}
                        {artista.preco}
                    </p>

                    <p>
                        <strong>Tags:</strong>{" "}
                        {artista.tags}
                    </p>

                    <p className={styles.descricao}>
                        {artista.descricao}
                    </p>


                  <button
    className={styles.botaoChat}
    onClick={() => navigate(`/chat/${id}`)}
>
    💬 Chat
</button>

                </div>

            </section>


            {/* =========================
                ARTES
            ========================= */}

            <section className={styles.artesSection}>

                <h2>
                    Portfólio
                </h2>


                {artes.length === 0 ? (

                    <p className={styles.semArtes}>
                        Este artista ainda não publicou
                        nenhuma arte.
                    </p>

                ) : (

                    <div className={styles.gradeArtes}>

                        {artes.map((arte) => (

                            <div
                                className={styles.arte}
                                key={arte.id}
                            >

                                <img
    src={arte.imagem}
    alt={arte.titulo}
    onClick={() => setImagemSelecionada(arte.imagem)}
    style={{ cursor: "pointer" }}
/>

                                {arte.titulo && (
                                    <div
                                        className={
                                            styles.tituloArte
                                        }
                                    >
                                        {arte.titulo}
                                    </div>
                                )}

                            </div>

                        ))}
{imagemSelecionada && (
    <div
        onClick={() => setImagemSelecionada(null)}
        style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "pointer"
        }}
    >
        <button
            onClick={() => setImagemSelecionada(null)}
            style={{
                position: "absolute",
                top: "20px",
                right: "30px",
                background: "none",
                border: "none",
                color: "white",
                fontSize: "40px",
                cursor: "pointer"
            }}
        >
            ×
        </button>

        <img
            src={imagemSelecionada}
            alt="Arte ampliada"
            onClick={(e) => e.stopPropagation()}
            style={{
                maxWidth: "90%",
                maxHeight: "90%",
                objectFit: "contain"
            }}
        />
    </div>
)}
                    </div>

                )}

            </section>

        </main>
    );
};

export default PortfolioArtista;