
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import "./CadastroForm.css";

const CadastroCliente = () => {
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
        const { name, value } = e.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMensagem("");
        setErro("");

        if (formulario.senha !== formulario.confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        try {
            const resposta = await apiFetch(
                "/api/clientes/cadastro",
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
                setErro(dados.erro || "Não foi possível criar a conta.");
                return;
            }

            navigate("/login/cliente");
        } catch (erro) {
            console.error(erro);
            setErro("Não foi possível conectar com o servidor.");
        }
    };

    return (
        <div className="cadastro-form-pagina">
            <h1>Cadastro de Cliente</h1>

            <form
                className="cadastro-form"
                onSubmit={handleSubmit}
            >
                <label htmlFor="username">
                    Nome de usuário
                </label>
                <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="Escolha um nome de usuário"
                    value={formulario.username}
                    onChange={handleChange}
                    autoComplete="username"
                    required
                />

                <label htmlFor="email">
                    E-mail
                </label>
                <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Digite o seu e-mail"
                    value={formulario.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                />

                <label htmlFor="senha">
                    Senha
                </label>
                <input
                    id="senha"
                    type="password"
                    name="senha"
                    placeholder="Crie uma senha"
                    value={formulario.senha}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                />

                <label htmlFor="confirmarSenha">
                    Confirmar senha
                </label>
                <input
                    id="confirmarSenha"
                    type="password"
                    name="confirmarSenha"
                    placeholder="Digite a senha novamente"
                    value={formulario.confirmarSenha}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                />

                <button type="submit">
                    Criar conta
                </button>
            </form>

            {mensagem && (
                <p className="cadastro-mensagem">{mensagem}</p>
            )}

            {erro && (
                <p className="cadastro-erro">{erro}</p>
            )}

            <Link to="/cadastro" className="cadastro-voltar">
                ← Voltar para escolha de cadastro
            </Link>
        </div>
    );
};

export default CadastroCliente;
