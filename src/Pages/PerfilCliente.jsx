
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

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

    const token = localStorage.getItem("tokenCliente");

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

                if (!resposta.ok) {
                    throw new Error("Não foi possível carregar o perfil.");
                }

       const dados = await resposta.json();
const perfil = dados.cliente || dados;

if (!perfil || !perfil.username) {
    console.error("Resposta recebida da API:", dados);
    throw new Error("A API não retornou os dados do cliente corretamente.");
}

                setCliente(perfil);
                setUsername(perfil.username || "");
                setEmail(perfil.email || "");
                setPreviewFoto(perfil.foto || perfil.foto_perfil || "");
                setDataCadastro(perfil.data_cadastro || "");

                localStorage.setItem("cliente", JSON.stringify(perfil));
            } catch (erro) {
                console.error("Erro ao carregar perfil:", erro);
                setMensagem("Não foi possível carregar os dados do perfil.");
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
            setMensagem("Selecione um arquivo de imagem.");
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
                throw new Error(dados.erro || dados.mensagem || "Erro ao salvar a foto.");
            }

            const clienteAtualizado = {
                ...cliente,
                foto: dados.foto,
                foto_perfil: dados.foto,
            };

            setCliente(clienteAtualizado);
            setPreviewFoto(dados.foto);
            setFoto(null);
            localStorage.setItem("cliente", JSON.stringify(clienteAtualizado));
            setMensagem("Foto de perfil atualizada!");
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
                throw new Error(dados.erro || dados.mensagem || "Erro ao atualizar perfil.");
            }

            const clienteAtualizado = {
                ...cliente,
                ...dados.cliente,
                foto: previewFoto || cliente.foto || cliente.foto_perfil || null,
                foto_perfil: previewFoto || cliente.foto_perfil || cliente.foto || null,
            };

            setCliente(clienteAtualizado);
            localStorage.setItem("cliente", JSON.stringify(clienteAtualizado));

            setSenha("");
            setConfirmarSenha("");
            setMensagem("Perfil atualizado com sucesso!");
        } catch (erro) {
            console.error("Erro ao atualizar perfil:", erro);
            setMensagem(erro.message || "Não foi possível atualizar o perfil.");
        }
    }

    function handleLogout() {
        localStorage.removeItem("tokenCliente");
        localStorage.removeItem("cliente");
        window.dispatchEvent(new Event("loginStatusChanged"));
        navigate("/");
    }

    if (carregando) {
        return <p>Carregando perfil...</p>;
    }

    return (
        <main className="perfil-cliente">
            <h1>Meu Perfil</h1>

            <section className="perfil-cliente-foto">
                {previewFoto ? (
                 <img
    src={previewFoto}
    alt="Foto de perfil"
    className="perfil-cliente-imagem"
    style={{
        width: "140px",
        height: "140px",
        objectFit: "cover",
        borderRadius: "50%",
        display: "block",
        marginBottom: "12px",
    }}
/>
                ) : (
                    <div className="perfil-cliente-sem-foto">
                        {username ? username.charAt(0).toUpperCase() : "?"}
                    </div>
                )}

                <div>
                    <input
                        ref={inputFotoRef}
                        type="file"
                        accept="image/*"
                        onChange={selecionarFoto}
                        hidden
                    />

                    <button
                        type="button"
                        onClick={() => inputFotoRef.current?.click()}
                    >
                        Escolher foto
                    </button>

                    {foto && (
                        <button
                            type="button"
                            onClick={salvarFoto}
                            disabled={enviandoFoto}
                        >
                            {enviandoFoto ? "Enviando..." : "Salvar foto"}
                        </button>
                    )}
                </div>
            </section>

            {dataCadastro && (
                <p>
                    Conta criada em:{" "}
                    {new Date(dataCadastro).toLocaleDateString("pt-BR")}
                </p>
            )}

            {mensagem && <p role="status">{mensagem}</p>}

            <form onSubmit={handleSubmit}>
                <label htmlFor="username">Nome de usuário</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <label htmlFor="email">E-mail</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label htmlFor="senha">Nova senha (opcional)</label>
                <input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                />

                <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                <input
                    id="confirmarSenha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    autoComplete="new-password"
                />

                <button type="submit">Salvar alterações</button>
            </form>

            <button type="button" onClick={handleLogout}>
                Sair da conta
            </button>
        </main>
    );
}

export default PerfilCliente;