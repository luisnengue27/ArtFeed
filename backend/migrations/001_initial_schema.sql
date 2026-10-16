-- ============================================================
-- 001_initial_schema.sql
-- Migracao: Azure SQL Server (mssql) -> PostgreSQL (Neon)
-- Banco comeca vazio. Nenhum dado antigo e importado.
-- Nomes em snake_case. Tipos convertidos para PostgreSQL.
-- ON DELETE CASCADE apenas onde especificado no SQL original.
-- ============================================================

-- ------------------------------------------------------------
-- 1. artistas
-- Usado em: authMiddleware, authOpcional, rotas de artistas,
--           seguidores, avaliacoes, artes, conversas, bloqueios
-- Colunas do SQL original: id, username, email, senha, data_cadastro
-- Colunas adicionais no codigo: ativo, foto_perfil
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artistas (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    data_cadastro TIMESTAMP NOT NULL DEFAULT now(),
    ativo BOOLEAN NOT NULL DEFAULT true,
    foto_perfil VARCHAR(500)
);

-- ------------------------------------------------------------
-- 2. clientes
-- Usado em: authMiddleware, authOpcional, rotas de clientes,
--           seguidores, avaliacoes, conversas, mensagens
-- Colunas do SQL original: id, username, email, senha, data_cadastro
-- Colunas adicionais no codigo: ativo, foto_perfil
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    data_cadastro TIMESTAMP NOT NULL DEFAULT now(),
    ativo BOOLEAN NOT NULL DEFAULT true,
    foto_perfil VARCHAR(500)
);

-- ------------------------------------------------------------
-- 3. administradores
-- Usado em: admin.js (login, cadastro, listar), criarAdminInicial.js
-- Colunas confirmadas: id, username, email, senha_hash, ativo, data_criacao
-- NAO existem: emails_bloqueados_administrativamente, historico_administrativo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS administradores (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_criacao TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 4. perfil_artista
-- Usado em: rotas de artistas (criar, editar, listar perfil)
-- Colunas do SQL original: id, artista_id, nome, preco, cidade, profissao,
--                          tags, descricao, foto_perfil, data_criacao
-- preco: VARCHAR(50) (era NVARCHAR(50) no SQL Server original, nao NUMERIC)
-- FK: artista_id -> artistas.id (ON DELETE CASCADE no SQL original)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfil_artista (
    id SERIAL PRIMARY KEY,
    artista_id INT NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    preco VARCHAR(50),
    cidade VARCHAR(100),
    profissao VARCHAR(100),
    tags VARCHAR(500),
    descricao TEXT,
    foto_perfil VARCHAR(255),
    data_criacao TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_perfil_artista_artista
        FOREIGN KEY (artista_id)
        REFERENCES artistas(id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 5. seguidores
-- Usado em: rotas de artistas (seguir, deixar de seguir, listar, contar)
-- Colunas do SQL original: id, cliente_id, artista_id, data_seguimento
-- Coluna adicional no codigo: artista_seguidor_id (quando artista segue artista)
-- Regras: cliente segue artista (cliente_id preenchido, artista_seguidor_id NULL)
--         artista segue artista (cliente_id NULL, artista_seguidor_id preenchido)
-- UNIQUE: cliente nao segue mesmo artista duas vezes
--         artista nao segue mesmo artista duas vezes
-- FKs: CASCADE apenas onde o SQL original especifica (cliente_id).
--      artista_id e artista_seguidor_id usam NO ACTION (padrao),
--      pois o SQL original nao especifica CASCADE para eles.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seguidores (
    id SERIAL PRIMARY KEY,
    cliente_id INT,
    artista_id INT NOT NULL,
    artista_seguidor_id INT,
    data_seguimento TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_seguidores_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_seguidores_artista
        FOREIGN KEY (artista_id)
        REFERENCES artistas(id),
    CONSTRAINT fk_seguidores_artista_seguidor
        FOREIGN KEY (artista_seguidor_id)
        REFERENCES artistas(id),
    CONSTRAINT uq_seguidores_cliente_artista
        UNIQUE (cliente_id, artista_id),
    CONSTRAINT uq_seguidores_artista_seguidor_artista
        UNIQUE (artista_seguidor_id, artista_id),
    CONSTRAINT chk_seguidores_tipo_seguidor
        CHECK (
            (cliente_id IS NOT NULL AND artista_seguidor_id IS NULL)
            OR (cliente_id IS NULL AND artista_seguidor_id IS NOT NULL)
        )
);

-- ------------------------------------------------------------
-- 6. avaliacoes (avaliacoes de artistas)
-- Usado em: rotas de artistas (avaliar artista, listar media)
-- Colunas do SQL original: id, cliente_id, artista_id, nota, comentario, data_avaliacao
-- Coluna adicional no codigo: artista_avaliador_id (quando artista avalia artista)
-- Regras: cliente avalia artista (cliente_id preenchido, artista_avaliador_id NULL)
--         artista avalia artista (cliente_id NULL, artista_avaliador_id preenchido)
-- UNIQUE: cliente nao avalia mesmo artista duas vezes
--         artista nao avalia mesmo artista duas vezes
-- CHECK: nota entre 1 e 5 (conforme validacao do codigo: nota < 1 || nota > 5)
-- FKs: CASCADE apenas onde o SQL original especifica (cliente_id).
--      artista_id e artista_avaliador_id usam NO ACTION (padrao),
--      pois o SQL original nao especifica CASCADE para eles.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INT,
    artista_id INT NOT NULL,
    nota NUMERIC(2,1) NOT NULL,
    comentario TEXT,
    data_avaliacao TIMESTAMP NOT NULL DEFAULT now(),
    artista_avaliador_id INT,
    CONSTRAINT fk_avaliacoes_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_avaliacoes_artista
        FOREIGN KEY (artista_id)
        REFERENCES artistas(id),
    CONSTRAINT fk_avaliacoes_artista_avaliador
        FOREIGN KEY (artista_avaliador_id)
        REFERENCES artistas(id),
    CONSTRAINT uq_avaliacoes_cliente_artista
        UNIQUE (cliente_id, artista_id),
    CONSTRAINT uq_avaliacoes_artista_avaliador_artista
        UNIQUE (artista_avaliador_id, artista_id),
    CONSTRAINT chk_avaliacoes_nota
        CHECK (nota >= 1 AND nota <= 5),
    CONSTRAINT chk_avaliacoes_tipo_avaliador
        CHECK (
            (cliente_id IS NOT NULL AND artista_avaliador_id IS NULL)
            OR (cliente_id IS NULL AND artista_avaliador_id IS NOT NULL)
        )
);

-- ------------------------------------------------------------
-- 7. avaliacoes_clientes (avaliacoes de clientes por artistas)
-- Usado em: rotas de clientes (avaliacao de cliente)
-- Tabela NAO existe no SQLQuery1.sql original, mas e usada no codigo
-- Colunas confirmadas: id, cliente_id, artista_id, nota
-- Regras: artista avalia cliente uma vez (UPSERT no codigo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes_clientes (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    artista_id INT NOT NULL,
    nota INT NOT NULL,
    CONSTRAINT fk_avaliacoes_clientes_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_avaliacoes_clientes_artista
        FOREIGN KEY (artista_id)
        REFERENCES artistas(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_avaliacoes_clientes_cliente_artista
        UNIQUE (cliente_id, artista_id),
    CONSTRAINT chk_avaliacoes_clientes_nota
        CHECK (nota >= 1 AND nota <= 5)
);

-- ------------------------------------------------------------
-- 8. artes (portifolio de artes do artista)
-- Usado em: rotas de artistas (cadastrar, listar, excluir artes)
-- Tabela NAO existe no SQLQuery1.sql original, mas e usada no codigo
-- Colunas confirmadas: id, artista_id, titulo, imagem, data_publicacao
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artes (
    id SERIAL PRIMARY KEY,
    artista_id INT NOT NULL,
    titulo VARCHAR(150),
    imagem VARCHAR(500) NOT NULL,
    data_publicacao TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_artes_artista
        FOREIGN KEY (artista_id)
        REFERENCES artistas(id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 9. artistas_bloqueados
-- Usado em: rotas de artistas e chat (bloquear, listar, verificar)
-- Tabela NAO existe no SQLQuery1.sql original, mas e usada no codigo
-- Colunas confirmadas: id, usuario_id, usuario_tipo, artista_id, data_bloqueio
-- usuario_tipo: 'artista' ou 'cliente'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artistas_bloqueados (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    usuario_tipo VARCHAR(20) NOT NULL,
    artista_id INT NOT NULL,
    data_bloqueio TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_artistas_bloqueados_artista
        FOREIGN KEY (artista_id)
        REFERENCES artistas(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_artistas_bloqueados_tipo
        CHECK (usuario_tipo IN ('artista', 'cliente'))
);

-- ------------------------------------------------------------
-- 10. conversas
-- Usado em: rotas de chat (criar, listar, buscar mensagens, detalhes)
-- Tabela NAO existe no SQLQuery1.sql original, mas e usada no codigo
-- Formatos validos:
--   Artista <-> Cliente: artista_id + cliente_id preenchidos, artista_destino_id NULL
--   Artista <-> Artista: artista_id + artista_destino_id preenchidos, cliente_id NULL
-- CHECK impede conversa de um artista consigo mesmo
-- Colunas confirmadas: id, artista_id, cliente_id, artista_destino_id, data_criacao
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversas (
    id SERIAL PRIMARY KEY,
    artista_id INT NOT NULL,
    cliente_id INT,
    artista_destino_id INT,
    data_criacao TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_conversas_artista
        FOREIGN KEY (artista_id)
        REFERENCES artistas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_conversas_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_conversas_artista_destino
        FOREIGN KEY (artista_destino_id)
        REFERENCES artistas(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_conversas_participantes
        CHECK (
            (cliente_id IS NOT NULL AND artista_destino_id IS NULL)
            OR (cliente_id IS NULL AND artista_destino_id IS NOT NULL)
        ),
    CONSTRAINT chk_conversas_nao_mesmo_artista
        CHECK (cliente_id IS NOT NULL OR artista_id <> artista_destino_id)
);

-- ------------------------------------------------------------
-- 11. mensagens
-- Usado em: rotas de chat (enviar texto, enviar imagem, listar mensagens)
-- Tabela NAO existe no SQLQuery1.sql original, mas e usada no codigo
-- Colunas confirmadas: id, conversa_id, remetente_tipo, remetente_id, texto, imagem, data_envio
-- Regras: mensagem de texto tem texto preenchido, imagem NULL
--         mensagem de imagem tem imagem preenchida, texto NULL
--         Pelo menos um dos dois deve estar preenchido (evita mensagem vazia)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INT NOT NULL,
    remetente_tipo VARCHAR(20) NOT NULL,
    remetente_id INT NOT NULL,
    texto TEXT,
    imagem VARCHAR(500),
    data_envio TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_mensagens_conversa
        FOREIGN KEY (conversa_id)
        REFERENCES conversas(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_mensagens_remetente_tipo
        CHECK (remetente_tipo IN ('artista', 'cliente')),
    CONSTRAINT chk_mensagens_texto_ou_imagem
        CHECK (texto IS NOT NULL OR imagem IS NOT NULL)
);

-- ------------------------------------------------------------
-- 12. denuncias_artistas
-- Usado em: rotas de artistas (denunciar artista)
-- Tabela NAO existe no SQLQuery1.sql original, mas e usada no codigo
-- Colunas confirmadas: id, denunciante_id, denunciante_tipo, artista_id, motivo
-- NAO existem: status, data_denuncia
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS denuncias_artistas (
    id SERIAL PRIMARY KEY,
    denunciante_id INT NOT NULL,
    denunciante_tipo VARCHAR(20) NOT NULL,
    artista_id INT NOT NULL,
    motivo TEXT NOT NULL,
    CONSTRAINT fk_denuncias_artistas_artista
        FOREIGN KEY (artista_id)
        REFERENCES artistas(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_denuncias_artistas_tipo
        CHECK (denunciante_tipo IN ('artista', 'cliente'))
);

-- ------------------------------------------------------------
-- 13. imagens_denuncias_artistas
-- Usado em: rotas de artistas (anexar imagens a denuncia)
-- Tabela NAO existe no SQLQuery1.sql original, mas e usada no codigo
-- Colunas confirmadas: id, denuncia_id, url_imagem
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imagens_denuncias_artistas (
    id SERIAL PRIMARY KEY,
    denuncia_id INT NOT NULL,
    url_imagem VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_imagens_denuncias_denuncia
        FOREIGN KEY (denuncia_id)
        REFERENCES denuncias_artistas(id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 14. mensagens_contato
-- Usado em: rota de contato (enviar mensagem de contato)
-- Tabela NAO existe no SQLQuery1.sql original, mas e usada no codigo
-- Colunas confirmadas: id, nome, email, assunto, mensagem
-- Coluna adicional: data_envio (padrao de auditoria)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mensagens_contato (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    assunto VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP NOT NULL DEFAULT now()
);