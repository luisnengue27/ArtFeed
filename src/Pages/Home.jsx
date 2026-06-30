import { Link } from "react-router-dom";
import styles from "./Home.module.css";
 import balao from "../assets/balao.png"
import CardArtista from "../Components/Card/CardArtista";

const Home = () => {
  return (
      <div className={styles.home}>

        <div className={styles.logon}>
        <h1>ARTFEED</h1>
        </div>

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

      <section className={styles.carde}>
        <CardArtista
        nome="ricardo"
        profissao="designe"
        />
        <CardArtista
        nome="mariane"
        profissao="pintora"
        />
        <CardArtista
        nome="raphinha"
        profissao="mangaka"
        />
        <CardArtista
        nome="joao"
        profissao="escultor"
        />
        <CardArtista
        nome="gabriele"
        profissao="desenhista"
        />
        <CardArtista
        nome="fabricio"
        profissao="pintor"
        />
        </section>
      <section className={styles.carder}>
        <CardArtista
        nome="marcos"
        profissao="ilustrador"
        />
        <CardArtista
        nome="matheus"
        profissao="mangaka"
        />
        <CardArtista
        nome="jennifer"
        profissao="pintora"
        />
        <CardArtista
        nome="cunha"
        profissao="mangaka"
        />
        <CardArtista
        nome="bardeli"
        profissao="ilustrador"
        />
        <CardArtista
        nome="bob"
        profissao="pintor"
        />
        </section>

     
    <Link to="/Login">
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