import { useState } from "react";
import { Link } from "react-router-dom";

const LoginCliente = () => {

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setErro("");
        setMensagem("");

        try {

           const resposta = await fetch(
    "/api/clientes/login",
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

            // Salva o token do cliente
           localStorage.removeItem("token");
localStorage.removeItem("artista");

localStorage.setItem("tokenCliente", dados.token);
localStorage.setItem("cliente", JSON.stringify(dados.cliente));
window.dispatchEvent(new Event("loginStatusChanged"));

            setMensagem(dados.mensagem);

            console.log(
                "Cliente logado:",
                dados.cliente
            );

        } catch (erro) {

            console.error(erro);

            setErro(
                "Não foi possível conectar com o servidor."
            );
        }
    };

    return (
        <div>

            <h1>Login de Cliente</h1>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>E-mail</label>

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
                    <label>Senha</label>

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

            </form>

            <p>
                Não possui uma conta?{" "}

                <Link to="/cadastro/cliente">
                    Cadastre-se como cliente
                </Link>
            </p>

            {mensagem && (
                <p>{mensagem}</p>
            )}

            {erro && (
                <p>{erro}</p>
            )}

        </div>
    );
};

export default LoginCliente;