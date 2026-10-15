
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CardPerfis from "../Components/CardPerfis/CardPerfis";
import styles from "./Perfis.module.css";
import { apiFetch } from "../services/api";

const Perfis = () => {
    const [perfis, setPerfis] = useState([]);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);

    const [searchParams] = useSearchParams();
    const termoBusca = searchParams.get("busca");

    useEffect(() => {
        let cancelado = false;

        const buscarPerfis = async () => {
            setCarregando(true);
            setErro("");

            try {
                let url = "/api/artistas";

                if (termoBusca && termoBusca.trim()) {
                    url = `/api/artistas/buscar?termo=${encodeURIComponent(
                        termoBusca.trim()
                    )}`;
                }

                const token =
                    localStorage.getItem("tokenCliente") ||
                    localStorage.getItem("token");

                const opcoes = token
                    ? { headers: { Authorization: `Bearer ${token}` } }
                    : {};

                const resposta = await apiFetch(url, opcoes);
                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível carregar os perfis."
                    );
                }

                if (!cancelado) {
                    setPerfis(dados);
                }
            } catch (erro) {
                if (!cancelado) {
                    console.error(erro);
                    setErro(
                        erro.message ||
                        "Não foi possível conectar com o servidor."
                    );
                    setPerfis([]);
                }
            } finally {
                if (!cancelado) {
                    setCarregando(false);
                }
            }
        };

        buscarPerfis();

        return () => {
            cancelado = true;
        };
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
                        tags={perfil.tags}
                        seguidores={null}
                        avaliacao={Number(perfil.avaliacao || 0).toFixed(1)}
                        numavaliacao={`(${perfil.numavaliacao || 0})`}
                    />
                ))}
            </div>

            {carregando && <p>Carregando perfis...</p>}

            {erro && <p role="alert">{erro}</p>}

            {!carregando && !erro && perfis.length === 0 && (
                <p>
                    {termoBusca
                        ? `Nenhum artista encontrado para "${termoBusca}".`
                        : "Nenhum artista encontrado."}
                </p>
            )}
        </div>
    );
};

export default Perfis;
