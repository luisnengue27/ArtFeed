import "./Carder.css";

const Carder = ({ imagem, nome, descricao }) => {
  return (
    <div className="carder">
      <img src={imagem} alt={nome} />

      <div className="overlay">
        <h2>{nome}</h2>
        <p>{descricao}</p>
      </div>
    </div>
  );
};

export default Carder;