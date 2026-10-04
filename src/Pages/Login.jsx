import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";
const Login = () => {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro("");
        setMensagem("");
        try {
           const resposta = await apiFetch(
         "/api/artistas/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        senha
                    })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro);
                return;
            }

            // Guardar o token
           localStorage.removeItem("tokenCliente");
localStorage.removeItem("cliente");

localStorage.setItem("token", dados.token);
localStorage.setItem("artista", JSON.stringify(dados.artista));
window.dispatchEvent(new Event("loginStatusChanged"));
            setMensagem(dados.mensagem);

            console.log("Artista logado:", dados.artista);

        } catch (erro) {

            console.error(erro);

            setErro(
                "Não foi possível conectar com o servidor."
            );
        }
    };


    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        E-mail
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                    />
                </div>
                <div>
                    <label>
                        Senha
                    </label>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) =>
                            setSenha(e.target.value)
                        }
                        required
                    />
                </div>
                <button type="submit">
    Entrar
</button>

<p>
    Não possui uma conta?{" "}
    <Link to="/cadastro/artista">
        Cadastre-se como artista
    </Link>
</p>
            </form>
       
            {mensagem && (
                <p>
                    {mensagem}
                </p>
            )}
            {erro && (
                <p>
                    {erro}
                </p>
            )}
        </div>
    );
};

export default Login;