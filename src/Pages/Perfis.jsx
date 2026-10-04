import { useEffect, useState } from "react";
import CardPerfis from "../Components/CardPerfis/CardPerfis";
import styles from "./Perfis.module.css";
import { apiFetch } from "../services/api";

const Perfis = () => {

    const [perfis, setPerfis] = useState([]);
    const [erro, setErro] = useState("");

    useEffect(() => {

        const buscarPerfis = async () => {

            try {

                const resposta = await apiFetch(
                    "/api/artistas"
                );

                const dados = await resposta.json();

                if (!resposta.ok) {
                    setErro(dados.erro);
                    return;
                }

                setPerfis(dados);

            } catch (erro) {

                console.error(erro);

                setErro(
                    "Não foi possível conectar com o servidor."
                );
            }
        };

        buscarPerfis();

    }, []);

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

        </div>
    );
};

export default Perfis;