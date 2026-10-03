import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CadastroArtista = () => {
    const navigate = useNavigate();
    const [formulario, setFormulario] = useState({
        username: "",
        email: "",
        senha: "",
        confirmarSenha: ""
    });

    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    const handleChange = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMensagem("");
        setErro("");

        // Verificar confirmação da senha
        if (formulario.senha !== formulario.confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        try {

            const resposta = await fetch(
                 "https://redesigned-broccoli-4q6prg9ppj52p54-3000.app.github.dev/api/artistas/cadastro",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: formulario.username,
                        email: formulario.email,
                        senha: formulario.senha
                    })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro);
                return;
            }


    navigate("/login");

            setMensagem(dados.mensagem);

            setFormulario({
                username: "",
                email: "",
                senha: "",
                confirmarSenha: ""
            });

        } catch (erro) {
            console.error(erro);

            setErro(
                "Não foi possível conectar com o servidor."
            );
        }
    };

    return (
        <div>

            <h1>Cadastro de Artista</h1>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Nome de usuário</label>

                    <input
                        type="text"
                        name="username"
                        value={formulario.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>E-mail</label>

                    <input
                        type="email"
                        name="email"
                        value={formulario.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Senha</label>

                    <input
                        type="password"
                        name="senha"
                        value={formulario.senha}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Confirmar senha</label>

                    <input
                        type="password"
                        name="confirmarSenha"
                        value={formulario.confirmarSenha}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit">
                    Criar conta
                </button>

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

export default CadastroArtista;