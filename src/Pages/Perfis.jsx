import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CardPerfis from "../Components/CardPerfis/CardPerfis";
import styles from "./Perfis.module.css";
import { apiFetch } from "../services/api";

const Perfis = () => {

    const [perfis, setPerfis] = useState([]);
    const [erro, setErro] = useState("");

    const [searchParams] = useSearchParams();

    const termoBusca = searchParams.get("busca");

    useEffect(() => {

        const buscarPerfis = async () => {

            try {

                setErro("");

                let url = "/api/artistas";

                // Se houver uma pesquisa
                if (termoBusca && termoBusca.trim()) {
                    url = `/api/artistas/buscar?termo=${encodeURIComponent(
                        termoBusca
                    )}`;
                }

                const resposta = await apiFetch(url);

                const dados = await resposta.json();

                if (!resposta.ok) {
                    setErro(
                        dados.erro ||
                        "Não foi possível realizar a pesquisa."
                    );
                    setPerfis([]);
                    return;
                }

                setPerfis(dados);

            } catch (erro) {

                console.error(erro);

                setErro(
                    "Não foi possível conectar com o servidor."
                );

                setPerfis([]);
            }
        };

        buscarPerfis();

    }, [termoBusca]);

    return (
        <div className={styles.home}>

            <div className={styles["cards-container"]}>

                {perfis.map((perfil) => (

                    <CardPerfis
                        key={perfil.id}
                        id={perfil.id}
                        nome={perfil.nome}
                        profissao={perfil.profissao}
                        preco={perfil.preco}
                        descricao={perfil.descricao}
                        cidade={perfil.cidade}
                        imagem={perfil.foto}
                        seguidores={null}
                        avaliacao="0"
                        numavaliacao="(0)"
                    />

                ))}

            </div>

            {erro && (
                <p>{erro}</p>
            )}

            {!erro && perfis.length === 0 && (
                <p>
                    {termoBusca
                        ? `Nenhum artista encontrado para "${termoBusca}".`
                        : "Nenhum artista encontrado."
                    }
                </p>
            )}

        </div>
    );
};

export default Perfis;