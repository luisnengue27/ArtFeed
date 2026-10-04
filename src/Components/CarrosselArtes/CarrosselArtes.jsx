import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";
import "./CarrosselArtes.css";

function embaralhar(array) {
    const copia = [...array];

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [copia[i], copia[j]] =
            [copia[j], copia[i]];
    }

    return copia;
}

function LinhaCarrossel({
    artes,
    direita = false
}) {

    // Duplica as artes para permitir
    // o movimento contínuo
    const imagens = [
        ...artes,
        ...artes
    ];

    return (
        <div className="carrossel">

            <div
                className={`carrossel-track ${
                    direita
                        ? "carrossel-direita"
                        : "carrossel-esquerda"
                }`}
            >

                {imagens.map((arte, index) => (

                    <div
                        className="arte-card"
                        key={`${arte.id}-${index}`}
                    >

                        <img
                            src={arte.imagem}
                            alt={
                                arte.titulo ||
                                "Arte publicada"
                            }
                        />

                    </div>

                ))}

            </div>

        </div>
    );
}

export default function CarrosselArtes() {

    const [artes, setArtes] =
        useState([]);

    const [carregando, setCarregando] =
        useState(true);

    useEffect(() => {

        const buscarArtes = async () => {

            try {

                const resposta = await apiFetch(
                    "/api/artistas/artes-carrossel"
                );

                if (!resposta.ok) {
                    throw new Error(
                        "Erro ao buscar artes"
                    );
                }

                const dados =
                    await resposta.json();

                console.log(
                    "🎨 Artes recebidas:",
                    dados
                );

                setArtes(
                    embaralhar(dados)
                );

            } catch (erro) {

                console.error(
                    "Erro ao carregar artes:",
                    erro
                );

            } finally {

                setCarregando(false);

            }
        };

        buscarArtes();

    }, []);


    if (carregando) {
        return null;
    }


    if (artes.length === 0) {
        return null;
    }


    // Cada linha recebe uma ordem diferente
    const linha1 = embaralhar(artes);
    const linha2 = embaralhar(artes);
    const linha3 = embaralhar(artes);


    return (
        <section className="carrossel-artes">

            <LinhaCarrossel
                artes={linha1}
                direita={true}
            />

            <LinhaCarrossel
                artes={linha2}
                direita={false}
            />

            <LinhaCarrossel
                artes={linha3}
                direita={true}
            />

        </section>
    );
}

