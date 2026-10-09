import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Conversas.module.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://artfeed-backend.onrender.com";


const Conversas = () => {

    const navigate = useNavigate();

    const [conversas, setConversas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");


    const pegarToken = () => {

        return (
            localStorage.getItem("tokenCliente") ||
            localStorage.getItem("token")
        );
    };


    useEffect(() => {

        const buscarConversas = async () => {

            try {

                const token = pegarToken();

                if (!token) {
                    navigate("/login");
                    return;
                }


                const resposta = await fetch(
                    `${API_URL}/api/chat/conversas`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );


              const dados = await resposta.json();

console.log("STATUS CONVERSAS:", resposta.status);
console.log("CONVERSAS RECEBIDAS:", dados);
console.log("TIPO DOS DADOS:", Array.isArray(dados));


                if (!resposta.ok) {

                    throw new Error(
                        dados.erro || "Erro ao buscar conversas"
                    );
                }


                setConversas(dados);

            } catch (erro) {

                console.error(
                    "Erro ao buscar conversas:",
                    erro
                );

                setErro(
                    erro.message ||
                    "Não foi possível carregar suas conversas."
                );

            } finally {

                setCarregando(false);
            }
        };


        buscarConversas();

    }, [navigate]);


   const abrirConversa = (conversa) => {
    navigate(`/chat/conversa/${conversa.conversa_id}`);
};

    if (carregando) {

        return (
            <main className={styles.conversas}>
                <p className={styles.status}>
                    Carregando conversas...
                </p>
            </main>
        );
    }


    if (erro) {

        return (
            <main className={styles.conversas}>
                <p className={styles.erro}>
                    {erro}
                </p>
            </main>
        );
    }


    return (
        <main className={styles.conversas}>

            <section className={styles.container}>

                <header className={styles.header}>

                    <h1>💬 Mensagens</h1>

                    <p>
                        Suas conversas
                    </p>

                </header>


                {conversas.length === 0 ? (

                    <div className={styles.vazio}>

                        <span>💬</span>

                        <h2>
                            Nenhuma conversa ainda
                        </h2>

                        <p>
                            Quando você iniciar uma conversa,
                            ela aparecerá aqui.
                        </p>

                    </div>

                ) : (

                    <div className={styles.lista}>

                        {conversas.map((conversa) => (

                            <button
                                key={conversa.conversa_id}
                                className={styles.conversa}
                                onClick={() =>
                                    abrirConversa(conversa)
                                }
                            >

                                <div className={styles.avatar}>
                                    🎨
                                </div>


                                <div className={styles.informacoes}>

                                    <div className={styles.topo}>

                                        <h2>

                                            {conversa.artista_username ||
                                                conversa.outro_username ||
                                                "Usuário"}

                                        </h2>


                                        {conversa.ultima_mensagem_data && (

                                            <time>

                                                {new Date(
                                                    conversa.ultima_mensagem_data
                                                ).toLocaleString(
                                                    "pt-BR",
                                                    {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    }
                                                )}

                                            </time>

                                        )}

                                    </div>


                                    <p>

                                        {conversa.ultima_mensagem ||
                                            "Nenhuma mensagem ainda."}

                                    </p>

                                </div>

                            </button>

                        ))}

                    </div>

                )}
                <div className={styles.chat}>
               <button
                              className={styles.voltar}
                              onClick={() => navigate(-1)}
                          >
                              ← Voltar
                          </button>
                          </div>
            </section>

        </main>
    );
};


export default Conversas;