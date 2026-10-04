import { Link } from "react-router-dom";
import styles from "./Carder.module.css";

const Carder = ({
  imagem,
  nome,
  descricao,
  artistaId
}) => {

  const card = (
    <div className={styles.carder}>

      <img
        src={imagem}
        alt={nome}
      />

      <div className={styles.overlay}>

        <h2>{nome}</h2>

        <p>{descricao}</p>

      </div>

    </div>
  );

  // Se a arte veio de um artista real,
  // o card leva para o perfil/portfólio.
  if (artistaId) {
    return (
      <Link
        to={`/perfil-artista/${artistaId}`}
        className={styles.link}
      >
        {card}
      </Link>
    );
  }

  // Artes provisórias não possuem artistaId.
  return card;
};

export default Carder;