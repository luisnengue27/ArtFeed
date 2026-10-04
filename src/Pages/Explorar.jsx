import { useEffect, useState } from "react";
import styles from "./Explorar.module.css";

import Carder from "../Components/Carder/Carder";

import art1 from "../assets/PerfisExplorar/ART1.jpg";
import art2 from "../assets/PerfisExplorar/ART2.png";
import art3 from "../assets/PerfisExplorar/ART3.png";
import art4 from "../assets/PerfisExplorar/ART4.jpg";
import art5 from "../assets/PerfisExplorar/ART5.png";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://artfeed-backend.onrender.com";

const imagensProvisorias = [
  art1,
  art2,
  art3,
  art4,
  art5,
  art3,
  art2,
  art5,
  art1,
  art4,
  art2,
  art3,
  art5,
  art1,
  art4,
];

const Explorar = () => {
  const [artes, setArtes] = useState([]);

  useEffect(() => {
    const buscarArtes = async () => {
      try {
        const resposta = await fetch(
          `${API_URL}/api/artistas/artes`
        );

        if (!resposta.ok) {
          throw new Error("Erro ao buscar artes");
        }

        const dados = await resposta.json();

        setArtes(dados);
      } catch (erro) {
        console.error("Erro ao carregar artes:", erro);
      }
    };

    buscarArtes();
  }, []);

  // Enquanto ainda não houver artes no banco,
  // usamos imagens provisórias.
  const mostrarArtes =
    artes.length > 0
      ? artes
      : imagensProvisorias.map((imagem, index) => ({
          id: `provisoria-${index}`,
          imagem,
          username: "Artista provisório",
          titulo: "Obra de arte",
          artista_id: null,
        }));

  return (
    <div className={styles.Explorado}>
      <section className={styles.containerCards}>

        {mostrarArtes.map((arte) => (
          <Carder
            key={arte.id}
            imagem={arte.imagem}
            nome={arte.username}
            descricao={arte.titulo}
            artistaId={arte.artista_id}
          />
        ))}

      </section>
    </div>
  );
};

export default Explorar;