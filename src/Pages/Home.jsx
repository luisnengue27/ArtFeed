import { Link } from "react-router-dom";
import styles from "./Home.module.css";
import balao from "../assets/balao.png";
import CarrosselArtes from "../Components/CarrosselArtes/CarrosselArtes";

const Home = () => {
  return (

 
<div className={styles.home}>

        <><div className={styles.logon}>

      <h1>ARTFEED</h1>

    </div><div>

        <Link to="/Login">

          <img
            src={balao}
            alt="Explorar"
            className={styles.Balao} />
        </Link>

     <div className={styles.fix}>
        <CarrosselArtes />
      </div>


      </div></>


</div>



  );
};



export default Home;