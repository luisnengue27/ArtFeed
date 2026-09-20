import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PerfilCliente = () => {
    const navigate = useNavigate();

    const cliente = JSON.parse(localStorage.getItem("cliente"));

    const [formulario, setFormulario] = useState({
        username: cliente?.username || "",
        email: cliente?.email || "",
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

        // Verifica se as novas senhas são iguais
        if (formulario.senha !== formulario.confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        const token = localStorage.getItem("tokenCliente");

        if (!token) {
            setErro("Você precisa estar logado como cliente.");
            return;
        }

        try {
            const resposta = await fetch(
                "http://localhost:3000/api/clientes/perfil",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
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

            // Atualiza os dados salvos no navegador
            localStorage.setItem(
                "cliente",
                JSON.stringify(dados.cliente)
            );

            setMensagem(dados.mensagem);

            // Limpa somente os campos de senha
            setFormulario({
                username: dados.cliente.username,
                email: dados.cliente.email,
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

    const handleLogout = () => {
        localStorage.removeItem("tokenCliente");
        localStorage.removeItem("cliente");

        window.dispatchEvent(
            new Event("loginStatusChanged")
        );

        navigate("/");
    };

    if (!cliente) {
        return (
            <div>
                <h1>Meu Perfil</h1>
                <p>Você não está logado como cliente.</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Meu Perfil</h1>

            <h2>Editar informações</h2>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Usuário</label>

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
                    <label>Nova senha</label>

                    <input
                        type="password"
                        name="senha"
                        value={formulario.senha}
                        onChange={handleChange}
                        placeholder="Deixe vazio para não alterar"
                    />
                </div>

                <div>
                    <label>Confirmar nova senha</label>

                    <input
                        type="password"
                        name="confirmarSenha"
                        value={formulario.confirmarSenha}
                        onChange={handleChange}
                        placeholder="Deixe vazio para não alterar"
                    />
                </div>

                <button type="submit">
                    Salvar alterações
                </button>

            </form>

            {mensagem && (
                <p>{mensagem}</p>
            )}

            {erro && (
                <p>{erro}</p>
            )}

            <hr />

            <button onClick={handleLogout}>
                Deslogar
            </button>
        </div>
    );
};

export default PerfilCliente;