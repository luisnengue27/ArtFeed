import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";

const PerfilArtista = () => {
const [perfilExiste, setPerfilExiste] = useState(false);

    const navigate = useNavigate();
const [formulario, setFormulario] = useState({
    username: "",
    email: "",
    senha: "",
    nome: "",
    preco: "",
    cidade: "",
    profissao: "",
    tags: "",
    descricao: ""
});

    const [foto, setFoto] = useState(null);

   const [mensagem, setMensagem] = useState("");
const [erro, setErro] = useState("");
    useEffect(() => {
        const carregarPerfil = async () => {

            const token = localStorage.getItem("token");
        
       

            if (!token) {
                setErro("Você precisa estar logado.");
                return;
            }

            try {

                const resposta = await apiFetch(
                    "/api/artistas/perfil",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const resultado = await resposta.json();

          if (!resposta.ok) {
    if (resposta.status === 404) {
        setPerfilExiste(false);

        setFormulario(prev => ({
            ...prev,
            username: resultado.username || "",
            email: resultado.email || ""
        }));

        return;
    }

    setErro(resultado.erro);
    return;
}

     console.log(
    "Perfil carregado:",
    resultado
);

setPerfilExiste(true);

setFormulario({
    username: resultado.username,
    email: resultado.email,
    senha: "",
    nome: resultado.nome || "",
    preco: resultado.preco || "",
    cidade: resultado.cidade || "",
    profissao: resultado.profissao || "",
    tags: resultado.tags
        ? resultado.tags.join(", ")
        : "",
    descricao: resultado.descricao || ""
});

            } catch (erro) {

                console.error(erro);

                setErro(
                    "Não foi possível carregar o perfil."
                );
            }
        };

        carregarPerfil();
       
    }, []);



    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("artista");

        window.dispatchEvent(
            new Event("loginStatusChanged")
        );

        navigate("/");
    };
    const handleChange = (e) => {
    setFormulario({
        ...formulario,
        [e.target.name]: e.target.value
    });
};

    const handleFoto = (e) => {
        setFoto(e.target.files[0]);
    };

   const handleSubmit = async (e) => {

    e.preventDefault();

    setMensagem("");
    setErro("");

    const token = localStorage.getItem("token");

    if (!token) {
        setErro("Você precisa estar logado.");
        return;
    }

    // =========================
    // CRIAR PERFIL
    // =========================

    if (!perfilExiste) {

        if (!foto) {
            setErro("A foto de perfil é obrigatória.");
            return;
        }

        const dados = new FormData();

        dados.append("nome", formulario.nome);
        dados.append("preco", formulario.preco);
        dados.append("cidade", formulario.cidade);
        dados.append("profissao", formulario.profissao);
        dados.append("tags", formulario.tags);
        dados.append("descricao", formulario.descricao);
        dados.append("foto", foto);

        try {

            const resposta = await apiFetch(
                "/api/artistas/perfil",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: dados
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                setErro(resultado.erro);
                return;
            }

           setMensagem(resultado.mensagem);
setPerfilExiste(true);

setFormulario(prev => ({
    ...prev,
    nome: resultado.perfil.nome,
    preco: resultado.perfil.preco,
    cidade: resultado.perfil.cidade,
    profissao: resultado.perfil.profissao,
    tags: resultado.perfil.tags.join(", "),
    descricao: resultado.perfil.descricao
}));

console.log(
    "Perfil criado:",
    resultado.perfil
);

        } catch (erro) {

            console.error(erro);

            setErro(
                "Não foi possível conectar com o servidor."
            );
        }

        return;
    }

    // =========================
    // EDITAR PERFIL
    // =========================

try {

    const dados = new FormData();

    dados.append("username", formulario.username);
    dados.append("email", formulario.email);
    dados.append("senha", formulario.senha);
    dados.append("nome", formulario.nome);
    dados.append("preco", formulario.preco);
    dados.append("cidade", formulario.cidade);
    dados.append("profissao", formulario.profissao);
    dados.append("tags", formulario.tags);
    dados.append("descricao", formulario.descricao);

    // Só envia a foto se o usuário escolher uma nova
    if (foto) {
        dados.append("foto", foto);
    }

    const resposta = await apiFetch(
        "/api/artistas/perfil",
        {
            method: "PUT",

            headers: {
                Authorization: `Bearer ${token}`
            },

            body: dados
        }
    );

    const resultado = await resposta.json();

    console.log("Dados recebidos do perfil:", resultado);

    if (!resposta.ok) {
        setErro(resultado.erro);
        return;
    }

    setMensagem(resultado.mensagem);

    console.log(
        "Perfil atualizado:",
        resultado
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

            <h1>Meu Perfil de Artista</h1>

            <form onSubmit={handleSubmit}>
            
                <label>Username</label>
<input
    type="text"
    name="username"
    value={formulario.username}
    onChange={handleChange}
/>

<label>E-mail</label>
<input
    type="email"
    name="email"
    value={formulario.email}
    onChange={handleChange}
/>

<label>Nova senha</label>
<input
    type="password"
    name="senha"
    value={formulario.senha}
    onChange={handleChange}
    placeholder="Deixe vazio para manter a senha atual"
/>
                <div>
                    <label>Nome</label>

                    <input
                        type="text"
                        name="nome"
                        value={formulario.nome}
                        onChange={handleChange}
                        required
                    />
                </div>


                <div>
                    <label>
                        Preço das artes
                    </label>

                    <input
                        type="text"
                        name="preco"
                        placeholder="Ex: R$ 200 - R$ 800"
                        value={formulario.preco}
                        onChange={handleChange}
                        required
                    />
                </div>


                <div>
                    <label>
                        Cidade natal
                    </label>

                    <input
                        type="text"
                        name="cidade"
                        value={formulario.cidade}
                        onChange={handleChange}
                        required
                    />
                </div>


                <div>
                    <label>Profissão</label>

                    <input
                        type="text"
                        name="profissao"
                        value={formulario.profissao}
                        onChange={handleChange}
                        required
                    />
                </div>


                <div>
                    <label>
                        Tags
                    </label>

                    <input
                        type="text"
                        name="tags"
                        placeholder="Retrato, Digital, Conceitual"
                        value={formulario.tags}
                        onChange={handleChange}
                        required
                    />

                    <small>
                        Separe as tags por vírgula.
                    </small>
                </div>


                <div>
                    <label>
                        Descrição
                    </label>

                    <textarea
                        name="descricao"
                        value={formulario.descricao}
                        onChange={handleChange}
                        required
                    />
                </div>


                <div>
                    <label>
                        Foto de perfil
                    </label>

                    <input
    type="file"
    accept="image/*"
    onChange={handleFoto}
    required={!perfilExiste}
/>
                </div>


               <button type="submit">
    {perfilExiste ? "Salvar alterações" : "Criar Perfil"}
</button>
<button
    type="button"
    onClick={() => navigate("/gerenciar-portfolio")}
>
    Gerenciar meu portfólio
</button>

            </form>


            {mensagem && (
                <p>{mensagem}</p>
            )}

            {erro && (
                <p>{erro}</p>
            )}

         
<button onClick={handleLogout}>
    Deslogar
</button>
        </div>
    );
}
export default PerfilArtista;