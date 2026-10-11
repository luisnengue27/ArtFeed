
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import "./PerfilArtista.css";

const PerfilArtista = () => {
    const navigate = useNavigate();

    const [perfilExiste, setPerfilExiste] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

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
    const [fotoAtual, setFotoAtual] = useState("");
    const [fotoPreview, setFotoPreview] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    useEffect(() => {
        return () => {
            if (fotoPreview) {
                URL.revokeObjectURL(fotoPreview);
            }
        };
    }, [fotoPreview]);

    useEffect(() => {
        const carregarPerfil = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setErro("Você precisa estar logado.");
                setCarregando(false);
                return;
            }

            try {
                const resposta = await apiFetch("/api/artistas/perfil", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

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

                    setErro(resultado.erro || "Não foi possível carregar o perfil.");
                    return;
                }

                const dadosPerfil = resultado.perfil || resultado;
                const tags = dadosPerfil.tags;

                setPerfilExiste(true);

                setFormulario({
                    username: resultado.username || dadosPerfil.username || "",
                    email: resultado.email || dadosPerfil.email || "",
                    senha: "",
                    nome: dadosPerfil.nome || "",
                    preco: dadosPerfil.preco || "",
                    cidade: dadosPerfil.cidade || "",
                    profissao: dadosPerfil.profissao || "",
                    tags: Array.isArray(tags)
                        ? tags.join(", ")
                        : tags || "",
                    descricao: dadosPerfil.descricao || ""
                });

                const imagem =
                    dadosPerfil.foto ||
                    dadosPerfil.foto_perfil ||
                    dadosPerfil.imagem ||
                    resultado.foto ||
                    resultado.foto_perfil ||
                    "";

                setFotoAtual(imagem);
            } catch (error) {
                console.error(error);
                setErro("Não foi possível carregar o perfil.");
            } finally {
                setCarregando(false);
            }
        };

        carregarPerfil();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("artista");

        window.dispatchEvent(new Event("loginStatusChanged"));
        navigate("/");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormulario(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMensagem("");
        setErro("");

        const token = localStorage.getItem("token");

        if (!token) {
            setErro("Você precisa estar logado.");
            return;
        }

        if (!perfilExiste && !foto) {
            setErro("A foto de perfil é obrigatória para criar seu perfil.");
            return;
        }

        setSalvando(true);

        try {
            const dados = new FormData();

            if (perfilExiste) {
                dados.append("username", formulario.username);
                dados.append("email", formulario.email);

                // Só envia a senha se o artista quiser alterá-la.
                if (formulario.senha.trim()) {
                    dados.append("senha", formulario.senha);
                }
            }

            dados.append("nome", formulario.nome);
            dados.append("preco", formulario.preco);
            dados.append("cidade", formulario.cidade);
            dados.append("profissao", formulario.profissao);
            dados.append("tags", formulario.tags);
            dados.append("descricao", formulario.descricao);

            if (foto) {
                dados.append("foto", foto);
            }

            const resposta = await apiFetch("/api/artistas/perfil", {
                method: perfilExiste ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: dados
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                setErro(resultado.erro || "Não foi possível salvar as alterações.");
                return;
            }

            setMensagem(resultado.mensagem || "Perfil salvo com sucesso.");
            setPerfilExiste(true);
            setFormulario(prev => ({
                ...prev,
                senha: ""
            }));
window.dispatchEvent(new Event("loginStatusChanged"));
            const dadosPerfil = resultado.perfil || resultado;
            const imagemAtualizada =
                dadosPerfil.foto ||
                dadosPerfil.foto_perfil ||
                dadosPerfil.imagem ||
                resultado.foto ||
                resultado.foto_perfil;

            if (imagemAtualizada) {
                setFotoAtual(imagemAtualizada);
            } else if (fotoPreview) {
                // Mantém a prévia visível caso a API não retorne a URL.
                setFotoAtual(fotoPreview);
            }

            setFoto(null);
            setFotoPreview("");
        } catch (error) {
            console.error(error);
            setErro("Não foi possível conectar com o servidor.");
        } finally {
            setSalvando(false);
        }
    };

    if (carregando) {
        return (
            <main className="perfil-artista-pagina">
                <p className="perfil-artista-status">Carregando seu perfil...</p>
            </main>
        );
    }

    return (
        <main className="perfil-artista-pagina">
            <div className="perfil-artista-container">
                <header className="perfil-artista-header">
                    <div>
                        <span className="perfil-artista-etiqueta">
                            ÁREA DO ARTISTA
                        </span>
                        <h1>Meu perfil</h1>
                        <p>
                            Gerencie seus dados de acesso e suas informações profissionais.
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
                </header>

                <form onSubmit={handleSubmit} className="perfil-artista-form">
                    <section className="perfil-artista-secao">
                        <div className="perfil-artista-titulo-secao">
                            <span className="perfil-artista-numero">01</span>
                            <div>
                                <h2>Foto de perfil</h2>
                                <p>Essa é a imagem que identifica você no ArtFeed.</p>
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
                                    {foto ? foto.name : "Sua foto de perfil"}
                                </strong>
                                <p>
                                    Escolha uma imagem para representar seu trabalho.
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

                    <section className="perfil-artista-secao">
                        <div className="perfil-artista-titulo-secao">
                            <span className="perfil-artista-numero">02</span>
                            <div>
                                <h2>Dados da conta</h2>
                                <p>Informações usadas para acessar sua conta.</p>
                            </div>
                        </div>

                        <div className="perfil-artista-grade">
                            <div className="perfil-artista-campo">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={formulario.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                />
                            </div>

                            <div className="perfil-artista-campo">
                                <label htmlFor="email">E-mail</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formulario.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="perfil-artista-campo perfil-artista-campo-completo">
                                <label htmlFor="senha">Nova senha</label>
                                <input
                                    id="senha"
                                    type="password"
                                    name="senha"
                                    value={formulario.senha}
                                    onChange={handleChange}
                                    placeholder="Deixe vazio para manter a senha atual"
                                    autoComplete="new-password"
                                />
                                <small>
                                    Por segurança, sua senha atual nunca é exibida.
                                </small>
                            </div>
                        </div>
                    </section>

                    <section className="perfil-artista-secao">
                        <div className="perfil-artista-titulo-secao">
                            <span className="perfil-artista-numero">03</span>
                            <div>
                                <h2>Perfil profissional</h2>
                                <p>Essas informações ajudam as pessoas a conhecer seu trabalho.</p>
                            </div>
                        </div>

                        <div className="perfil-artista-grade">
                            <div className="perfil-artista-campo">
                                <label htmlFor="nome">Nome de exibição</label>
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
                                <label htmlFor="profissao">Profissão</label>
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
                                <label htmlFor="preco">Preço das artes</label>
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
                                <label htmlFor="cidade">Cidade</label>
                                <input
                                    id="cidade"
                                    type="text"
                                    name="cidade"
                                    value={formulario.cidade}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="perfil-artista-campo perfil-artista-campo-completo">
                                <label htmlFor="tags">Tags do seu trabalho</label>
                                <input
                                    id="tags"
                                    type="text"
                                    name="tags"
                                    value={formulario.tags}
                                    onChange={handleChange}
                                    placeholder="Retrato, Digital, Conceitual"
                                    required
                                />
                                <small>Separe cada tag com uma vírgula.</small>
                            </div>

                            <div className="perfil-artista-campo perfil-artista-campo-completo">
                                <label htmlFor="descricao">Sobre você e seu trabalho</label>
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

                    {mensagem && (
                        <p className="perfil-artista-mensagem" role="status">
                            {mensagem}
                        </p>
                    )}

                    {erro && (
                        <p className="perfil-artista-erro" role="alert">
                            {erro}
                        </p>
                    )}

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

                <footer className="perfil-artista-rodape">
                    <div>
                        <strong>Quer sair da sua conta?</strong>
                        <p>Você poderá entrar novamente quando quiser.</p>
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
