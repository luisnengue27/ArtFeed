
import { Link } from "react-router-dom";
import styles from "./Home.module.css";
import balao from "../assets/balao.png";
import CarrosselArtes from "../Components/CarrosselArtes/CarrosselArtes";

const Home = () => {
    return (
        <main className={styles.home}>
            <div className={styles.logon}>
                <h1>ARTFEED</h1>
            </div>

            <Link to="/conversas" aria-label="Conversas">
                <img
                    src={balao}
                    alt="Conversas"
                    className={styles.Balao}
                />
            </Link>

            <div className={styles.fix}>
                <CarrosselArtes />
            </div>
        </main>
    );
};

export default Home;
