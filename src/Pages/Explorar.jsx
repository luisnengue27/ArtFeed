import { Link } from "react-router-dom";
import styles from "./Explorar.module.css"


import Carder from "../Components/Carder/Carder"

import michael from "../assets/PerfisExplorar/ART1.jpg";
import freddie from "../assets/PerfisExplorar/ART2.png";
import amano from "../assets/PerfisExplorar/ART3.png";
import zombie from "../assets/PerfisExplorar/ART4.jpg";
import jorge from "../assets/PerfisExplorar/ART5.png";
import maria from "../assets/PerfisExplorar/ART3.png";



const Explorar = () => {
  return (
    <div className={styles.Explorado} >

      <section className={styles.containerCards}>
        <Carder
        imagem={michael}
        nome="Michael Job"
        descricao="O Rei das artes, conhecido por revolucionar as artes."
      />

      <Carder
        imagem={freddie}
        nome="Freddie Mercurio"
        descricao="um cara que desenha mas muito bem, tipo ele e bem top."
      />

      <Carder
        imagem={amano}
        nome="Eminem jr"
        descricao="Um dos artista mais conhecidos no exterior."
      />
        <Carder
        imagem={zombie}
        nome="junior senior"
        descricao="O principe das artes, conhecido por revolucionar a forma de se pensar em artes."
      />

      <Carder
        imagem={jorge}
        nome="Freddie juninm"
        descricao="Vocalista do Queen e o maior artista do mundo."
      />

      </section>
      <section className={styles.containerCards}>
       <Carder
        imagem={maria}
        nome="mana sabia"
        descricao="Uma das artista mais bem sucedidas da sua carreira."
      />

      <Carder
        imagem={freddie}
        nome="Freddie Mercurio"
        descricao="um cara que desenha mas muito bem, tipo ele e bem top."
      />

      <Carder
        imagem={amano}
        nome="Eminem jr"
        descricao="Um dos artista mais conhecidos no exterior."
      />
        <Carder
        imagem={zombie}
        nome="junior senior"
        descricao="O principe das artes, conhecido por revolucionar a forma de se pensar em artes."
      />

      <Carder
        imagem={jorge}
        nome="Freddie juninm"
        descricao="Vocalista do Queen e o maior artista do mundo."
      />

      </section>

   

    
    </div>
  );
};

export default Explorar;