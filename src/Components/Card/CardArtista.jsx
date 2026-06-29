import styles from "./CardArtista.module.css";

const CardArtista = ({ nome, profissao }) => {
  return (
    <div className={styles.card}>
      <h2>{nome}</h2>
      <p>{profissao}</p>
    </div>
  );
};

export default CardArtista;