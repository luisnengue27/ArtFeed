
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import "./PerfilCliente.css";

function PerfilCliente() {
    const navigate = useNavigate();
    const inputFotoRef = useRef(null);

    const [cliente, setCliente] = useState({});
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [foto, setFoto] = useState(null);
    const [previewFoto, setPreviewFoto] = useState("");
    const [dataCadastro, setDataCadastro] = useState("");

    const [mensagem, setMensagem] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [enviandoFoto, setEnviandoFoto] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const token = localStorage.getItem("tokenCliente");

    useEffect(() => {
        return () => {
            if (previewFoto.startsWith("blob:")) {
                URL.revokeObjectURL(previewFoto);
            }
        };
    }, [previewFoto]);

    useEffect(() => {
        if (!token) {
            navigate("/");
            return;
        }

        async function carregarPerfil() {
            try {
                const resposta = await apiFetch("/api/clientes/perfil", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro ||
                        dados.mensagem ||
                        "Não foi possível carregar o perfil."
                    );
                }

                const perfil = dados.cliente || dados;

                if (!perfil || !perfil.username) {
                    console.error("Resposta recebida da API:", dados);
                    throw new Error(
                        "A API não retornou os dados do cliente corretamente."
                    );
                }

                const imagem =
                    perfil.foto ||
                    perfil.foto_perfil ||
                    "";

                setCliente(perfil);
                setUsername(perfil.username || "");
                setEmail(perfil.email || "");
                setPreviewFoto(imagem);
                setDataCadastro(perfil.data_cadastro || "");

                localStorage.setItem("cliente", JSON.stringify(perfil));
            } catch (erro) {
                console.error("Erro ao carregar perfil:", erro);
                setMensagem(
                    erro.message || "Não foi possível carregar os dados do perfil."
                );
            } finally {
                setCarregando(false);
            }
        }

        carregarPerfil();
    }, [token, navigate]);

    function selecionarFoto(evento) {
        const arquivo = evento.target.files?.[0];

        if (!arquivo) return;

        if (!arquivo.type.startsWith("image/")) {
            setMensagem("Selecione um arquivo de imagem válido.");
            evento.target.value = "";
            return;
        }

        if (arquivo.size > 5 * 1024 * 1024) {
            setMensagem("A imagem deve ter no máximo 5 MB.");
            evento.target.value = "";
            return;
        }

        setFoto(arquivo);
        setPreviewFoto(URL.createObjectURL(arquivo));
        setMensagem("");
    }

    async function salvarFoto() {
        if (!foto) {
            setMensagem("Selecione uma imagem primeiro.");
            return;
        }

        setEnviandoFoto(true);
        setMensagem("");

        try {
            const formulario = new FormData();
            formulario.append("foto", foto);

            const resposta = await apiFetch("/api/clientes/perfil/foto", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formulario,
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || dados.mensagem || "Erro ao salvar a foto."
                );
            }

            const imagemSalva = dados.foto || dados.foto_perfil;

            if (!imagemSalva) {
                throw new Error(
                    "A foto foi enviada, mas a API não retornou seu endereço."
                );
            }

            const clienteAtualizado = {
                ...cliente,
                foto: imagemSalva,
                foto_perfil: imagemSalva,
            };

            setCliente(clienteAtualizado);
            setPreviewFoto(imagemSalva);
            setFoto(null);

            if (inputFotoRef.current) {
                inputFotoRef.current.value = "";
            }

          localStorage.setItem("cliente", JSON.stringify(clienteAtualizado));

window.dispatchEvent(new Event("loginStatusChanged"));

setMensagem("Foto de perfil atualizada com sucesso!");
        } catch (erro) {
            console.error("Erro ao salvar foto:", erro);
            setMensagem(erro.message || "Não foi possível salvar a foto.");
        } finally {
            setEnviandoFoto(false);
        }
    }

    async function handleSubmit(evento) {
        evento.preventDefault();
        setMensagem("");

        if (senha && senha !== confirmarSenha) {
            setMensagem("As senhas não coincidem.");
            return;
        }

        setSalvando(true);

        try {
            const resposta = await apiFetch("/api/clientes/perfil", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username,
                    email,
                    senha,
                }),
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || dados.mensagem || "Erro ao atualizar perfil."
                );
            }

            const clienteAtualizado = {
                ...cliente,
                ...(dados.cliente || {}),
                username,
                email,
                foto: cliente.foto || cliente.foto_perfil || null,
                foto_perfil: cliente.foto_perfil || cliente.foto || null,
            };

            setCliente(clienteAtualizado);
            localStorage.setItem("cliente", JSON.stringify(clienteAtualizado));

window.dispatchEvent(new Event("loginStatusChanged"));
            setSenha("");
            setConfirmarSenha("");
            setMensagem("Dados da conta atualizados com sucesso!");
        } catch (erro) {
            console.error("Erro ao atualizar perfil:", erro);
            setMensagem(
                erro.message || "Não foi possível atualizar os dados da conta."
            );
        } finally {
            setSalvando(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem("tokenCliente");
        localStorage.removeItem("cliente");

        window.dispatchEvent(new Event("loginStatusChanged"));
        navigate("/");
    }

    if (carregando) {
        return (
            <main className="perfil-cliente-pagina">
                <p className="perfil-cliente-status">Carregando seu perfil...</p>
            </main>
        );
    }

    return (
        <main className="perfil-cliente-pagina">
            <div className="perfil-cliente-container">
                <header className="perfil-cliente-header">
                    <div>
                        <span className="perfil-cliente-etiqueta">
                            ÁREA DO CLIENTE
                        </span>
                        <h1>Meu perfil</h1>
                        <p>
                            Gerencie suas informações pessoais e mantenha sua conta atualizada.
                        </p>
                    </div>
                </header>

                {mensagem && (
                    <p className="perfil-cliente-mensagem" role="status">
                        {mensagem}
                    </p>
                )}

                <section className="perfil-cliente-secao">
                    <div className="perfil-cliente-titulo-secao">
                        <span className="perfil-cliente-numero">01</span>
                        <div>
                            <h2>Foto de perfil</h2>
                            <p>Escolha a imagem que representa você na comunidade.</p>
                        </div>
                    </div>

                    <div className="perfil-cliente-foto-area">
                        {previewFoto ? (
                            <img
                                src={previewFoto}
                                alt="Prévia da foto de perfil"
                                className="perfil-cliente-imagem"
                            />
                        ) : (
                            <div className="perfil-cliente-sem-foto">
                                {username ? username.charAt(0).toUpperCase() : "?"}
                            </div>
                        )}

                        <div className="perfil-cliente-foto-info">
                            <strong>
                                {foto ? foto.name : "Sua foto de perfil"}
                            </strong>
                            <p>Formatos de imagem aceitos, até 5 MB.</p>

                            <input
                                ref={inputFotoRef}
                                type="file"
                                accept="image/*"
                                onChange={selecionarFoto}
                                hidden
                            />

                            <div className="perfil-cliente-foto-acoes">
                                <button
                                    type="button"
                                    className="perfil-cliente-botao-foto"
                                    onClick={() => inputFotoRef.current?.click()}
                                >
                                    Escolher imagem
                                </button>

                                {foto && (
                                    <>
                                        <button
                                            type="button"
                                            className="perfil-cliente-botao-foto-salvar"
                                            onClick={salvarFoto}
                                            disabled={enviandoFoto}
                                        >
                                            {enviandoFoto ? "Enviando..." : "Salvar foto"}
                                        </button>

                                        <button
                                            type="button"
                                            className="perfil-cliente-cancelar-foto"
                                            onClick={() => {
                                                setFoto(null);
                                                setPreviewFoto(
                                                    cliente.foto ||
                                                    cliente.foto_perfil ||
                                                    ""
                                                );
                                                setMensagem("");

                                                if (inputFotoRef.current) {
                                                    inputFotoRef.current.value = "";
                                                }
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <form onSubmit={handleSubmit} className="perfil-cliente-form">
                    <section className="perfil-cliente-secao">
                        <div className="perfil-cliente-titulo-secao">
                            <span className="perfil-cliente-numero">02</span>
                            <div>
                                <h2>Dados da conta</h2>
                                <p>Atualize seu nome de usuário e seu endereço de e-mail.</p>
                            </div>
                        </div>

                        <div className="perfil-cliente-grade">
                            <div className="perfil-cliente-campo">
                                <label htmlFor="cliente-username">Nome de usuário</label>
                                <input
                                    id="cliente-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>

                            <div className="perfil-cliente-campo">
                                <label htmlFor="cliente-email">E-mail</label>
                                <input
                                    id="cliente-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        {dataCadastro && (
                            <div className="perfil-cliente-data">
                                <span aria-hidden="true">◷</span>
                                <div>
                                    <small>MEMBRO DESDE</small>
                                    <strong>
                                        {new Date(dataCadastro).toLocaleDateString("pt-BR")}
                                    </strong>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="perfil-cliente-secao">
                        <div className="perfil-cliente-titulo-secao">
                            <span className="perfil-cliente-numero">03</span>
                            <div>
                                <h2>Segurança</h2>
                                <p>
                                    Altere sua senha quando precisar. Deixe os campos vazios
                                    para manter a senha atual.
                                </p>
                            </div>
                        </div>

                        <div className="perfil-cliente-grade">
                            <div className="perfil-cliente-campo">
                                <label htmlFor="cliente-senha">Nova senha</label>
                                <input
                                    id="cliente-senha"
                                    type="password"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="Digite uma nova senha"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="perfil-cliente-campo">
                                <label htmlFor="cliente-confirmar-senha">
                                    Confirmar nova senha
                                </label>
                                <input
                                    id="cliente-confirmar-senha"
                                    type="password"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    placeholder="Repita a nova senha"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="perfil-cliente-acoes">
                        <button
                            type="submit"
                            className="perfil-cliente-botao-salvar"
                            disabled={salvando}
                        >
                            {salvando ? "Salvando..." : "Salvar alterações"}
                        </button>
                    </div>
                </form>

                <footer className="perfil-cliente-rodape">
                    <div>
                        <strong>Deseja sair da sua conta?</strong>
                        <p>Você poderá entrar novamente quando quiser.</p>
                    </div>

                    <button
                        type="button"
                        className="perfil-cliente-botao-sair"
                        onClick={handleLogout}
                    >
                        Sair da conta
                    </button>
                </footer>
            </div>
        </main>
    );
}

export default PerfilCliente;
