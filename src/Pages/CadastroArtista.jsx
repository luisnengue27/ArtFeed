import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { Link } from "react-router-dom";
import "./CadastroForm.css";

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

         const resposta = await apiFetch(
  "/api/artistas/cadastro",
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
    <div className="cadastro-form-pagina">
        <h1>Cadastro de Artista</h1>

        <form className="cadastro-form" onSubmit={handleSubmit}>
            {/* Mantenha aqui os quatro campos existentes */}
            {/* Nome de usuário, e-mail, senha e confirmar senha */}

            {/* Mantenha o botão Criar conta */}
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

export default CadastroArtista;