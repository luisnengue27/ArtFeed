SELECT
    protocol_type,
    net_transport,
    local_net_address,
    local_tcp_port
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;

USE ArtFeed;
GO

SELECT *
FROM PerfilArtista;

SELECT
    a.id,
    a.username,
    a.email,
    p.id AS perfil_id,
    p.nome
FROM Artistas a
LEFT JOIN PerfilArtista p
    ON a.id = p.artista_id
WHERE a.email = 'artista_sql@teste.com';

USE ArtFeed;
GO

SELECT * FROM Clientes;

SELECT id, username, email
FROM Clientes;

USE ArtFeed;
GO

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME LIKE '%Seg%'
   OR TABLE_NAME LIKE '%Segu%'
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT *
FROM Seguidores;

SELECT
    @@SERVERNAME AS Servidor,
    SERVERPROPERTY('ServerName') AS NomeServidor,
    SERVERPROPERTY('InstanceName') AS Instancia,
    SERVERPROPERTY('Edition') AS Edicao;

    SELECT
    SERVERPROPERTY('ProductVersion') AS Versao,
    SERVERPROPERTY('ProductMajorVersion') AS VersaoPrincipal;