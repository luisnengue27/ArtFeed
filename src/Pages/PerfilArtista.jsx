
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import "./PerfilArtista.css";

const TAGS_DISPONIVEIS = [
    "Ilustração",
    "Arte digital",
    "Retrato",
    "Personagens",
    "Concept art",
    "Pintura",
    "Anime e mangá",
    "Pixel art",
    "Paisagem",
    "Arte abstrata",
    "Design gráfico",
    "Quadrinhos",
    "Fotografia",
    "Escultura",
    "3D",
    "Tipografia",
    "Fanart",
    "Realismo"
];

const PerfilArtista = () => {
    const navigate = useNavigate();

    const [perfilExiste, setPerfilExiste] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [conta, setConta] = useState({
        username: "",
        email: "",
        senhaAtual: "",
        novaSenha: ""
    });

    const [formulario, setFormulario] = useState({
        nome: "",
        preco: "",
        cidade: "",
        profissao: "",
        tags: "",
        descricao: ""
    });

    const [foto, setFoto] = useState(null);
    const [fotoAtual, setFotoAtual] = useState("");
    const [fotoPreview, setFotoPreview] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    // Liberar URL temporária da imagem
    useEffect(() => {
        return () => {
            if (fotoPreview) {
                URL.revokeObjectURL(fotoPreview);
            }
        };
    }, [fotoPreview]);

    // Carregar dados da conta e do perfil
    useEffect(() => {
        const carregarDados = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setErro("Você precisa estar logado.");
                setCarregando(false);
                return;
            }

            try {
                // Dados da conta
                const respostaConta = await apiFetch(
                    "/api/artistas/conta",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const dadosConta = await respostaConta.json();

                if (!respostaConta.ok) {
                    throw new Error(
                        dadosConta.erro ||
                        "Não foi possível carregar sua conta."
                    );
                }

                setConta(prev => ({
                    ...prev,
                    username: dadosConta.username || "",
                    email: dadosConta.email || ""
                }));

                // Perfil profissional
                const respostaPerfil = await apiFetch(
                    "/api/artistas/perfil",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const dadosPerfil = await respostaPerfil.json();

                if (respostaPerfil.status === 404) {
                    setPerfilExiste(false);
                    return;
                }

                if (!respostaPerfil.ok) {
                    throw new Error(
                        dadosPerfil.erro ||
                        "Não foi possível carregar seu perfil."
                    );
                }

                setPerfilExiste(true);

                setFormulario({
                    nome: dadosPerfil.nome || "",
                    preco: dadosPerfil.preco || "",
                    cidade: dadosPerfil.cidade || "",
                    profissao: dadosPerfil.profissao || "",
                    tags: Array.isArray(dadosPerfil.tags)
                        ? dadosPerfil.tags.join(", ")
                        : dadosPerfil.tags || "",
                    descricao: dadosPerfil.descricao || ""
                });

                setFotoAtual(
                    dadosPerfil.foto ||
                    dadosPerfil.foto_perfil ||
                    ""
                );

            } catch (error) {
                console.error(error);
                setErro(
                    error.message ||
                    "Não foi possível carregar seus dados."
                );
            } finally {
                setCarregando(false);
            }
        };

        carregarDados();
    }, []);

    // Sair da conta
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("artista");

        window.dispatchEvent(new Event("loginStatusChanged"));
        navigate("/");
    };

    // Alterar dados da conta
    const handleContaChange = (e) => {
        const { name, value } = e.target;

        setConta(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Alterar dados profissionais
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulario(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Tags selecionadas
    const tagsSelecionadas = formulario.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);

    // Selecionar ou desmarcar tags
    const handleTagToggle = (tag) => {
        setFormulario(prev => {
            const atuais = prev.tags
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);

            const jaSelecionada = atuais.includes(tag);

            const atualizadas = jaSelecionada
                ? atuais.filter(item => item !== tag)
                : [...atuais, tag];

            return {
                ...prev,
                tags: atualizadas.join(", ")
            };
        });
    };

    // Selecionar foto
    const handleFoto = (e) => {
        const arquivo = e.target.files?.[0];

        if (!arquivo) return;

        if (!arquivo.type.startsWith("image/")) {
            setErro("Selecione um arquivo de imagem válido.");
            e.target.value = "";
            return;
        }

        setErro("");
        setMensagem("");
        setFoto(arquivo);
        setFotoPreview(URL.createObjectURL(arquivo));
    };

    // Salvar dados da conta
    const handleSalvarConta = async (e) => {
        e.preventDefault();

        setSalvando(true);
        setMensagem("");
        setErro("");

        try {
            const token = localStorage.getItem("token");

            const resposta = await apiFetch(
                "/api/artistas/conta",
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(conta)
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Erro ao atualizar a conta."
                );
            }

            setConta(prev => ({
                ...prev,
                username: dados.artista.username,
                email: dados.artista.email,
                senhaAtual: "",
                novaSenha: ""
            }));

            const artistaSalvo = JSON.parse(
                localStorage.getItem("artista") || "{}"
            );

            localStorage.setItem(
                "artista",
                JSON.stringify({
                    ...artistaSalvo,
                    ...dados.artista
                })
            );

            window.dispatchEvent(
                new Event("loginStatusChanged")
            );

            setMensagem(
                dados.mensagem || "Conta atualizada com sucesso!"
            );

        } catch (error) {
            setErro(error.message);
        } finally {
            setSalvando(false);
        }
    };

    // Salvar perfil profissional
    const handleSalvarPerfil = async (e) => {
        e.preventDefault();

        setSalvando(true);
        setMensagem("");
        setErro("");

        try {
            const token = localStorage.getItem("token");
            const dados = new FormData();

            dados.append("nome", formulario.nome);
            dados.append("preco", formulario.preco);
            dados.append("cidade", formulario.cidade);
            dados.append("profissao", formulario.profissao);
            dados.append("tags", formulario.tags);
            dados.append("descricao", formulario.descricao);

            if (foto) {
                dados.append("foto", foto);
            }

            const resposta = await apiFetch(
                "/api/artistas/perfil",
                {
                    method: perfilExiste ? "PUT" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: dados
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Erro ao salvar o perfil."
                );
            }

            setPerfilExiste(true);
            setFoto(null);

            if (resultado.foto) {
                setFotoAtual(resultado.foto);
                setFotoPreview("");
            }

            setMensagem(
                resultado.mensagem || "Perfil salvo com sucesso!"
            );

        } catch (error) {
            setErro(error.message);
        } finally {
            setSalvando(false);
        }
    };

    if (carregando) {
        return (
            <main className="perfil-artista-pagina">
                <p className="perfil-artista-status">
                    Carregando seu perfil...
                </p>
            </main>
        );
    }

    return (
        <main className="perfil-artista-pagina">
            <div className="perfil-artista-container">

                {/* Cabeçalho */}
                <header className="perfil-artista-header">
                    <div>
                        <span className="perfil-artista-etiqueta">
                            ÁREA DO ARTISTA
                        </span>

                        <h1>Meu perfil</h1>

                        <p>
                            Gerencie seus dados de acesso e suas
                            informações profissionais.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="perfil-artista-botao-secundario"
                        onClick={() => navigate("/gerenciar-portfolio")}
                    >
                        <span aria-hidden="true">▧</span>
                        Gerenciar portfólio
                    </button>

                    <button
                        type="button"
                        className="perfil-artista-botao-secundario"
                        onClick={() => navigate("/artistas-bloqueados")}
                    >
                        Artistas bloqueados
                    </button>
                </header>

                <div className="perfil-artista-form">

                    {/* FORMULÁRIO DA CONTA */}
                    <form onSubmit={handleSalvarConta}>

                        <section className="perfil-artista-secao">
                            <div className="perfil-artista-titulo-secao">
                                <span className="perfil-artista-numero">
                                    01
                                </span>

                                <div>
                                    <h2>Dados da conta</h2>
                                    <p>
                                        Informações usadas para acessar
                                        sua conta.
                                    </p>
                                </div>
                            </div>

                            <div className="perfil-artista-grade">

                                <div className="perfil-artista-campo">
                                    <label htmlFor="username">
                                        Username
                                    </label>

                                    <input
                                        id="username"
                                        type="text"
                                        name="username"
                                        value={conta.username}
                                        onChange={handleContaChange}
                                        autoComplete="username"
                                        required
                                    />
                                </div>

                                <div className="perfil-artista-campo">
                                    <label htmlFor="email">
                                        E-mail
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={conta.email}
                                        onChange={handleContaChange}
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <div className="perfil-artista-campo">
                                    <label htmlFor="senhaAtual">
                                        Senha atual
                                    </label>

                                    <input
                                        id="senhaAtual"
                                        type="password"
                                        name="senhaAtual"
                                        value={conta.senhaAtual}
                                        onChange={handleContaChange}
                                        autoComplete="current-password"
                                        placeholder="Necessária para alterar a senha"
                                    />
                                </div>

                                <div className="perfil-artista-campo">
                                    <label htmlFor="novaSenha">
                                        Nova senha
                                    </label>

                                    <input
                                        id="novaSenha"
                                        type="password"
                                        name="novaSenha"
                                        value={conta.novaSenha}
                                        onChange={handleContaChange}
                                        autoComplete="new-password"
                                        placeholder="Deixe vazio para manter a senha"
                                    />
                                </div>

                            </div>

                            <div className="perfil-artista-acoes">
                                <button
                                    type="submit"
                                    className="perfil-artista-botao-salvar"
                                    disabled={salvando}
                                >
                                    {salvando
                                        ? "Salvando..."
                                        : "Salvar dados da conta"}
                                </button>
                            </div>
                        </section>
                    </form>

                    {/* FORMULÁRIO DO PERFIL PROFISSIONAL */}
                    <form onSubmit={handleSalvarPerfil}>

                        {/* Foto de perfil */}
                        <section className="perfil-artista-secao">
                            <div className="perfil-artista-titulo-secao">
                                <span className="perfil-artista-numero">
                                    02
                                </span>

                                <div>
                                    <h2>Foto de perfil</h2>
                                    <p>
                                        Essa é a imagem que identifica
                                        você no ArtFeed.
                                    </p>
                                </div>
                            </div>

                            <div className="perfil-artista-foto-area">

                                <div className="perfil-artista-avatar">
                                    {fotoPreview || fotoAtual ? (
                                        <img
                                            src={fotoPreview || fotoAtual}
                                            alt="Prévia da foto de perfil"
                                        />
                                    ) : (
                                        <span aria-hidden="true">✦</span>
                                    )}
                                </div>

                                <div className="perfil-artista-foto-info">
                                    <strong>
                                        {foto
                                            ? foto.name
                                            : "Sua foto de perfil"}
                                    </strong>

                                    <p>
                                        Escolha uma imagem para representar
                                        seu trabalho.
                                    </p>

                                    <label className="perfil-artista-upload">
                                        Escolher imagem

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFoto}
                                        />
                                    </label>

                                    {fotoPreview && (
                                        <button
                                            type="button"
                                            className="perfil-artista-remover-preview"
                                            onClick={() => {
                                                setFoto(null);
                                                setFotoPreview("");
                                            }}
                                        >
                                            Cancelar nova foto
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Informações profissionais */}
                        <section className="perfil-artista-secao">
                            <div className="perfil-artista-titulo-secao">
                                <span className="perfil-artista-numero">
                                    03
                                </span>

                                <div>
                                    <h2>Perfil profissional</h2>
                                    <p>
                                        Essas informações ajudam as pessoas
                                        a conhecer seu trabalho.
                                    </p>
                                </div>
                            </div>

                            <div className="perfil-artista-grade">

                                <div className="perfil-artista-campo">
                                    <label htmlFor="nome">
                                        Nome de exibição
                                    </label>

                                    <input
                                        id="nome"
                                        type="text"
                                        name="nome"
                                        value={formulario.nome}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="perfil-artista-campo">
                                    <label htmlFor="profissao">
                                        Profissão
                                    </label>

                                    <input
                                        id="profissao"
                                        type="text"
                                        name="profissao"
                                        value={formulario.profissao}
                                        onChange={handleChange}
                                        placeholder="Ex.: Ilustrador"
                                        required
                                    />
                                </div>

                                <div className="perfil-artista-campo">
                                    <label htmlFor="preco">
                                        Preço das artes
                                    </label>

                                    <input
                                        id="preco"
                                        type="text"
                                        name="preco"
                                        value={formulario.preco}
                                        onChange={handleChange}
                                        placeholder="Ex.: R$ 200 - R$ 800"
                                        required
                                    />
                                </div>

                                <div className="perfil-artista-campo">
                                    <label htmlFor="cidade">
                                        Cidade
                                    </label>

                                    <input
                                        id="cidade"
                                        type="text"
                                        name="cidade"
                                        value={formulario.cidade}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Tags */}
                                <div className="perfil-artista-campo perfil-artista-campo-completo">
                                    <label>
                                        Tags do seu trabalho
                                    </label>

                                    <p className="perfil-artista-tags-ajuda">
                                        Selecione as opções que melhor
                                        representam seu estilo e suas técnicas.
                                    </p>

                                    <div className="perfil-artista-tags">
                                        {TAGS_DISPONIVEIS.map(tag => {
                                            const selecionada =
                                                tagsSelecionadas.includes(tag);

                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    className={`perfil-artista-tag ${
                                                        selecionada
                                                            ? "selecionada"
                                                            : ""
                                                    }`}
                                                    aria-pressed={selecionada}
                                                    onClick={() =>
                                                        handleTagToggle(tag)
                                                    }
                                                >
                                                    {selecionada ? "✓ " : "+ "}
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <small>
                                        {tagsSelecionadas.length}{" "}
                                        {tagsSelecionadas.length === 1
                                            ? "tag selecionada"
                                            : "tags selecionadas"}
                                    </small>
                                </div>

                                {/* Descrição */}
                                <div className="perfil-artista-campo perfil-artista-campo-completo">
                                    <label htmlFor="descricao">
                                        Sobre você e seu trabalho
                                    </label>

                                    <textarea
                                        id="descricao"
                                        name="descricao"
                                        value={formulario.descricao}
                                        onChange={handleChange}
                                        placeholder="Conte um pouco sobre seu estilo, suas técnicas e sua experiência..."
                                        rows={5}
                                        required
                                    />
                                </div>

                            </div>
                        </section>

                        {/* Mensagens */}
                        {mensagem && (
                            <p
                                className="perfil-artista-mensagem"
                                role="status"
                            >
                                {mensagem}
                            </p>
                        )}

                        {erro && (
                            <p
                                className="perfil-artista-erro"
                                role="alert"
                            >
                                {erro}
                            </p>
                        )}

                        {/* Botão de salvar perfil */}
                        <div className="perfil-artista-acoes">
                            <button
                                type="submit"
                                className="perfil-artista-botao-salvar"
                                disabled={salvando}
                            >
                                {salvando
                                    ? "Salvando..."
                                    : perfilExiste
                                        ? "Salvar alterações"
                                        : "Criar perfil"}
                            </button>
                        </div>

                    </form>
                </div>

                {/* Rodapé */}
                <footer className="perfil-artista-rodape">
                    <div>
                        <strong>Quer sair da sua conta?</strong>
                        <p>
                            Você poderá entrar novamente quando quiser.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="perfil-artista-botao-sair"
                        onClick={handleLogout}
                    >
                        Sair da conta
                    </button>
                </footer>

            </div>
        </main>
    );
};

export default PerfilArtista;
