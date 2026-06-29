import { Link } from "react-router-dom";
import styles from "./Home.module.css";
 import balao from "../assets/balao.png"
import CardArtista from "../Components/Card/CardArtista";

const Home = () => {
  return (
      <div className={styles.home}>

      <section className={styles.card}>
        <CardArtista
        nome="luis"
        profissao="designe"
        />
        <CardArtista
        nome="maria"
        profissao="ilustrador"
        />
        <CardArtista
        nome="pedro"
        profissao="mangaka"
        />
        <CardArtista
        nome="joana"
        profissao="desenhista"
        />
        <CardArtista
        nome="gabriela"
        profissao="mangaka"
        />
        <CardArtista
        nome="eduardo"
        profissao="pintor"
        />
        </section>

     
    <Link to="/explorar">
  <img
    src={balao}
    alt="Explorar"
    className={styles.Balao}
  />
</Link>
        
       
    </div>
    
  );
};

export default Home;