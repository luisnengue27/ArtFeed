import { apiFetch } from "../services/api";
import { useState } from "react";
import "./FaleConosco.css";

const FaleConosco = () => {
  const [formulario, setFormulario] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
  });

  const [enviando, setEnviando] = useState(false);
const [status, setStatus] = useState({
  tipo: "",
  mensagem: "",
});
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

 
const handleSubmit = async (e) => {
  e.preventDefault();

  setEnviando(true);
  setStatus({ tipo: "", mensagem: "" });

  try {
    const resposta = await apiFetch("/api/contato", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formulario),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem || "Não foi possível enviar a mensagem."
      );
    }

    setStatus({
      tipo: "sucesso",
      mensagem: "Mensagem enviada com sucesso! Obrigado pelo contato.",
    });

    setFormulario({
      nome: "",
      email: "",
      assunto: "",
      mensagem: "",
    });
  } catch (erro) {
    setStatus({
      tipo: "erro",
      mensagem:
        erro.message || "Erro ao enviar. Tente novamente mais tarde.",
    });
  } finally {
    setEnviando(false);
  }
};


  return (
    <main className="fale-conosco">
      <section className="contato-intro">
        <span className="contato-etiqueta">ARTFEED • SUPORTE</span>

        <h1>Vamos conversar?</h1>

        <p>
          Tem alguma dúvida, sugestão ou encontrou algum problema?
          Envie uma mensagem para nossa equipe. Ficaremos felizes
          em ouvir você!
        </p>
      </section>

      <section className="contato-container">
        <div className="contato-info">
          <h2>Estamos aqui para ajudar!</h2>

          <p>
            O ArtFeed é um espaço para artistas compartilharem suas
            criações e encontrarem novas oportunidades.
          </p>

          <div className="contato-item">
            <span className="contato-icone">✉</span>
            <div>
              <h3>Entre em contato</h3>
              <p>Envie sua dúvida ou sugestão pelo formulário.</p>
            </div>
          </div>

          <div className="contato-item">
            <span className="contato-icone">🎨</span>
            <div>
              <h3>Comunidade artística</h3>
              <p>
                Sua opinião ajuda a melhorar a experiência
                de todos no ArtFeed.
              </p>
            </div>
          </div>
        </div>

        <form className="contato-form" onSubmit={handleSubmit}>
          <h2>Envie sua mensagem</h2>
{status.mensagem && (
  <p
    className={`contato-status ${status.tipo}`}
    role="status"
    aria-live="polite"
  >
    {status.mensagem}
  </p>
)}
          <div className="contato-campo">
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              name="nome"
              type="text"
              placeholder="Como podemos chamar você?"
              value={formulario.nome}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="contato-campo">
            <label htmlFor="email">Seu e-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="voce@exemplo.com"
              value={formulario.email}
              onChange={handleChange}
              maxLength={254}
              required
            />
          </div>

          <div className="contato-campo">
            <label htmlFor="assunto">Assunto</label>
            <select
              id="assunto"
              name="assunto"
              value={formulario.assunto}
              onChange={handleChange}
              required
            >
              <option value="">Selecione um assunto</option>
              <option value="Duvida">Dúvida</option>
              <option value="Problema tecnico">Problema técnico</option>
              <option value="Sugestao">Sugestão</option>
              <option value="Denuncia">Denúncia</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="contato-campo">
            <label htmlFor="mensagem">Mensagem</label>
            <textarea
              id="mensagem"
              name="mensagem"
              placeholder="Conte para nós como podemos ajudar..."
              value={formulario.mensagem}
              onChange={handleChange}
              maxLength={3000}
              rows={6}
              required
            />
          </div>

          <button type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default FaleConosco;
