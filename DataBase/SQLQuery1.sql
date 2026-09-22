USE ArtFeed;
GO

CREATE TABLE Artistas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(150) NOT NULL UNIQUE,
    senha NVARCHAR(100) NOT NULL,
    data_cadastro DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE Clientes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(150) NOT NULL UNIQUE,
    senha NVARCHAR(100) NOT NULL,
    data_cadastro DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

USE ArtFeed;
GO


CREATE TABLE PerfilArtista (
    id INT IDENTITY(1,1) PRIMARY KEY,

    artista_id INT NOT NULL UNIQUE,

    nome NVARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NULL,
    cidade NVARCHAR(100) NULL,
    profissao NVARCHAR(100) NULL,
    tags NVARCHAR(500) NULL,
    descricao NVARCHAR(MAX) NULL,
    foto_perfil NVARCHAR(255) NULL,

    data_criacao DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT FK_Perfil_Artista
        FOREIGN KEY (artista_id)
        REFERENCES Artistas(id)
        ON DELETE CASCADE
);
GO

USE ArtFeed;
GO

CREATE TABLE Seguidores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL,
    artista_id INT NOT NULL,
    data_seguimento DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Seguidores_Cliente
        FOREIGN KEY (cliente_id)
        REFERENCES Clientes(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Seguidores_Artista
        FOREIGN KEY (artista_id)
        REFERENCES Artistas(id),

    CONSTRAINT UQ_Seguidores
        UNIQUE (cliente_id, artista_id)
);
GO


CREATE TABLE Avaliacoes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL,
    artista_id INT NOT NULL,
    nota DECIMAL(2,1) NOT NULL,
    comentario NVARCHAR(1000) NULL,
    data_avaliacao DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Avaliacoes_Cliente
        FOREIGN KEY (cliente_id)
        REFERENCES Clientes(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Avaliacoes_Artista
        FOREIGN KEY (artista_id)
        REFERENCES Artistas(id),

    CONSTRAINT UQ_Avaliacoes
        UNIQUE (cliente_id, artista_id),

    CONSTRAINT CK_Avaliacoes_Nota
        CHECK (nota >= 0 AND nota <= 5)
);
GO


--teste marotos abaixo \/ \/ \/

USE ArtFeed;
GO

INSERT INTO Artistas (username, email, senha)
VALUES (
    'artista_teste',
    'artista@teste.com',
    'HASH_DE_TESTE'
);
GO

INSERT INTO Clientes (username, email, senha)
VALUES (
    'cliente_teste',
    'cliente@teste.com',
    'HASH_DE_TESTE'
);
GO

INSERT INTO PerfilArtista (
    artista_id,
    nome,
    preco,
    cidade,
    profissao,
    tags,
    descricao,
    foto_perfil
)
VALUES (
    1,
    'Artista de Teste',
    150.00,
    'São Paulo',
    'Ilustrador',
    'ilustração, desenho, arte digital',
    'Perfil de teste do ArtFeed.',
    'artista-teste.jpg'
);
GO

SELECT * FROM Artistas;

SELECT * FROM Clientes;

SELECT * FROM PerfilArtista;

USE ArtFeed;
GO

INSERT INTO Seguidores (cliente_id, artista_id)
VALUES (1, 1);
GO

SELECT
    s.id,
    c.username AS cliente,
    a.username AS artista,
    s.data_seguimento
FROM Seguidores s
INNER JOIN Clientes c
    ON s.cliente_id = c.id
INNER JOIN Artistas a
    ON s.artista_id = a.id;

    INSERT INTO Seguidores (cliente_id, artista_id)
VALUES (1, 1);

DELETE FROM Seguidores
WHERE cliente_id = 1
  AND artista_id = 1;

  SELECT * FROM Seguidores;

  USE ArtFeed;
GO

INSERT INTO Avaliacoes (
    cliente_id,
    artista_id,
    nota,
    comentario
)
VALUES (
    1,
    1,
    4.5,
    'Gostei muito do trabalho do artista.'
);
GO

SELECT
    av.id,
    c.username AS cliente,
    a.username AS artista,
    av.nota,
    av.comentario,
    av.data_avaliacao
FROM Avaliacoes av
INNER JOIN Clientes c
    ON av.cliente_id = c.id
INNER JOIN Artistas a
    ON av.artista_id = a.id;

    SELECT
    artista_id,
    AVG(nota) AS media_avaliacao,
    COUNT(*) AS quantidade_avaliacoes
FROM Avaliacoes
GROUP BY artista_id;


INSERT INTO Avaliacoes (
    cliente_id,
    artista_id,
    nota
)
VALUES (
    1,
    1,
    5.0
);

-- fim dos testes marotos ^^^^