const fs = require('fs');
const p = 'c:\\Users\\Micro\\Documents\\vs-code\\projeto-4\\ArtFeed\\backend\\routes\\artistas.js';
let c = fs.readFileSync(p, 'utf8');

// Correcao 1: GET /artes (linhas 811-826 aprox)
const old1 = '        const resultado = await poolNeon.query(\n            `SELECT\n                Artes.id, Artes.artista_id, Artes.titulo, Artes.imagem,\n                Artes.data_publicacao, Artistas.username\n             FROM Artes\n             INNER JOIN Artistas ON Artes.artista_id = Artistas.id\n             WHERE $1 IS NULL\n               OR NOT EXISTS (\n                 SELECT 1 FROM artistas_bloqueados b\n                 WHERE b.usuario_id = $1\n                   AND b.usuario_tipo = $2\n                   AND b.artista_id = Artes.artista_id\n             )\n             ORDER BY Artes.data_publicacao DESC`,\n            [usuarioId, tipoUsuario]\n        );';

const new1 = '        let resultado;\n\n        if (usuarioId === null) {\n            resultado = await poolNeon.query(\n                `SELECT\n                    Artes.id, Artes.artista_id, Artes.titulo, Artes.imagem,\n                    Artes.data_publicacao, Artistas.username\n                 FROM Artes\n                 INNER JOIN Artistas ON Artes.artista_id = Artistas.id\n                 ORDER BY Artes.data_publicacao DESC`\n            );\n        } else {\n            resultado = await poolNeon.query(\n                `SELECT\n                    Artes.id, Artes.artista_id, Artes.titulo, Artes.imagem,\n                    Artes.data_publicacao, Artistas.username\n                 FROM Artes\n                 INNER JOIN Artistas ON Artes.artista_id = Artistas.id\n                 WHERE NOT EXISTS (\n                     SELECT 1 FROM artistas_bloqueados b\n                     WHERE b.usuario_id = $1::integer\n                       AND b.usuario_tipo = $2\n                       AND b.artista_id = Artes.artista_id\n                 )\n                 ORDER BY Artes.data_publicacao DESC`,\n                [usuarioId, tipoUsuario]\n            );\n        }';

if (c.includes(old1)) {
    c = c.replace(old1, new1);
    console.log('OK - GET /artes corrigido');
} else {
    console.log('FALHA - GET /artes nao encontrado');
}

// Correcao 2: GET /artes-carrossel (linhas 931-946 aprox)
const old2 = '        const resultado = await poolNeon.query(\n            `SELECT\n                Artes.id, Artes.titulo, Artes.imagem,\n                Artes.artista_id, PerfilArtista.nome AS artista_nome\n             FROM Artes\n             INNER JOIN PerfilArtista\n                 ON Artes.artista_id = PerfilArtista.artista_id\n             WHERE $1 IS NULL\n               OR NOT EXISTS (\n                 SELECT 1 FROM artistas_bloqueados b\n                 WHERE b.usuario_id = $1\n                   AND b.usuario_tipo = $2\n                   AND b.artista_id = Artes.artista_id\n             )\n             ORDER BY Artes.data_publicacao DESC`,\n            [usuarioId, tipoUsuario]\n        );';

const new2 = '        if (usuarioId === null) {\n            resultado = await poolNeon.query(\n                `SELECT\n                    Artes.id, Artes.titulo, Artes.imagem,\n                    Artes.artista_id, PerfilArtista.nome AS artista_nome\n                 FROM Artes\n                 INNER JOIN PerfilArtista\n                     ON Artes.artista_id = PerfilArtista.artista_id\n                 ORDER BY Artes.data_publicacao DESC`\n            );\n        } else {\n            resultado = await poolNeon.query(\n                `SELECT\n                    Artes.id, Artes.titulo, Artes.imagem,\n                    Artes.artista_id, PerfilArtista.nome AS artista_nome\n                 FROM Artes\n                 INNER JOIN PerfilArtista\n                     ON Artes.artista_id = PerfilArtista.artista_id\n                 WHERE NOT EXISTS (\n                     SELECT 1 FROM artistas_bloqueados b\n                     WHERE b.usuario_id = $1::integer\n                       AND b.usuario_tipo = $2\n                       AND b.artista_id = Artes.artista_id\n                 )\n                 ORDER BY Artes.data_publicacao DESC`,\n                [usuarioId, tipoUsuario]\n            );\n        }';

if (c.includes(old2)) {
    c = c.replace(old2, new2);
    console.log('OK - GET /artes-carrossel corrigido');
} else {
    console.log('FALHA - GET /artes-carrossel nao encontrado');
}

fs.writeFileSync(p, c, 'utf8');
console.log('Arquivo salvo');
