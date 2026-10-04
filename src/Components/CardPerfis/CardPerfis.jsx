import { useEffect, useState } from "react";
import styles from "./CardPerfis.module.css";
import { apiFetch } from "../../services/api";

const CardPerfis = ({
    id,
    nome,
    profissao,
    imagem,
    preco,
    cidade,
    descricao,
    avaliacao,
    numavaliacao
}) => {

     const [seguindo, setSeguindo] = useState(false);
     const [erroSeguir, setErroSeguir] = useState("");
     const [quantidadeSeguidores, setQuantidadeSeguidores] = useState(0);

   useEffect(() => {

    const buscarDados = async () => {

        try {

            // ============================
            // BUSCAR QUANTIDADE DE SEGUIDORES
            // ============================

            const respostaSeguidores = await apiFetch(
                `/api/artistas/${id}/seguidores`
            );

            const dadosSeguidores =
                await respostaSeguidores.json();

            if (respostaSeguidores.ok) {
                setQuantidadeSeguidores(
                    dadosSeguidores.seguidores
                );
            }

            // ============================
            // VERIFICAR SE O CLIENTE SEGUE
            // ============================

            const token =
                localStorage.getItem("tokenCliente");

            if (!token) {
                return;
            }

            const respostaSeguindo = await apiFetch(
                `/api/artistas/${id}/seguindo`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dadosSeguindo =
                await respostaSeguindo.json();

            if (respostaSeguindo.ok) {
                setSeguindo(
                    dadosSeguindo.seguindo
                );
            }

        } catch (erro) {

            console.error(erro);

        }
    };

    buscarDados();

}, [id]);
const handleSeguir = async () => {

    const token = localStorage.getItem("tokenCliente");

    if (!token) {
        setErroSeguir("Você precisa estar logado como cliente.");
        return;
    }

    try {

        // Se já está seguindo, deixa de seguir
        if (seguindo) {

            const resposta = await apiFetch(
                `/api/artistas/${id}/seguir`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setErroSeguir(dados.erro);
                return;
            }

            setSeguindo(false);
            setErroSeguir("");

            setQuantidadeSeguidores(
                quantidadeSeguidores - 1
            );

            return;
        }

        // Se não está seguindo, segue
        const resposta = await apiFetch(
            `/api/artistas/${id}/seguir`,
            {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            setErroSeguir(dados.erro);
            return;
        }

        setSeguindo(true);
        setErroSeguir("");

        setQuantidadeSeguidores(
            quantidadeSeguidores + 1
        );

    } catch (erro) {

        console.error(erro);

        setErroSeguir(
            "Não foi possível conectar com o servidor."
        );
    }
};
    return (
      <div className={styles["card-artista"]}>

            {/* Destaque */}
         <div className={styles.destaque}>
                ⚡ Destaque
            </div>

            {/* Parte superior */}
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

                <span className={styles["status"]}>●</span>

            </div>

            {/* Descrição */}
            <p className={styles["descricao"]}>
              {descricao}
            </p>

            {/* Tags */}
            <div className={styles["tags"]}>
                <span>Retrato</span>
                <span>Digital</span>
                <span>Conceitual</span>
            </div>

            {/* Avaliação */}
            <div className={styles["linha-avaliacao"]}>

                <div className={styles["avaliacao"]}>
              <span className="estrelas">★★★★★</span>
               <span> {avaliacao} {numavaliacao}</span>
                </div>

                <div className={styles["localizacao"]}>
                    {cidade}
                </div>

            </div>

            {/* Seguidores */}
            <div className={styles["linha-inferior"]}>

                <span className="preco">
                    {preco}
                </span>

               <span className="seguidores">
    {quantidadeSeguidores} seguidores
</span>

            </div>

            {/* Botões */}
            <div className={styles["botoes"]}>

                <button className="portfolio">
                    Ver Portfólio
                </button>

           <button
    className="seguir"
    onClick={handleSeguir}
>
    {seguindo ? "Seguindo" : "Seguir"}
</button>   
{erroSeguir && (
    <p>{erroSeguir}</p>
)}

            </div>

        </div>
    );
};

export default CardPerfis;