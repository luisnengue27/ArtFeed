const fs = require('fs');
let c = fs.readFileSync('backend/routes/chat.js', 'utf8');
c = c.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// 1. Substituir pool.request() por poolNeon.query()
c = c.replace(/pool\.request\(\)/g, 'poolNeon');

// 2. Remover linhas .input() soltas
c = c.replace(/\s*\.input\([^)]+\)\s*/g, '');

// 3. Substituir recordset por rows
c = c.replace(/recordset/g, 'rows');

// 4. Substituir dbo. por vazio
c = c.replace(/dbo\./g, '');

// 5. Substituir TOP 1 por LIMIT 1
c = c.replace(/TOP 1/g, 'LIMIT 1');

// 6. Substituir OUTPUT INSERTED.* por RETURNING *
c = c.replace(/OUTPUT INSERTED\.\*/g, 'RETURNING *');

// 7. Substituir OUTPUT INSERTED.col por RETURNING col
c = c.replace(/OUTPUT INSERTED\.([a-zA-Z_]+)/g, 'RETURNING $1');

// 8. Tabelas
c = c.replace(/FROM Conversas/g, 'FROM conversas');
c = c.replace(/FROM Mensagens/g, 'FROM mensagens');
c = c.replace(/FROM ArtistasBloqueados/g, 'FROM artistas_bloqueados');
c = c.replace(/FROM Artistas/g, 'FROM artistas');
c = c.replace(/FROM Clientes/g, 'FROM clientes');
c = c.replace(/FROM PerfilArtista/g, 'FROM perfil_artista');
c = c.replace(/INSERT INTO Conversas/g, 'INSERT INTO conversas');
c = c.replace(/INSERT INTO Mensagens/g, 'INSERT INTO mensagens');

// 9. Processar blocos .query() para @param -> $N
const queryRegex = /poolNeon\.query\(`([\s\S]*?)`\)/g;
c = c.replace(queryRegex, (match, sql) => {
    const params = [];
    const paramRegex = /@([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let m;
    while ((m = paramRegex.exec(sql)) !== null) {
        if (!params.includes(m[1])) params.push(m[1]);
    }
    let pIdx = 0;
    const newSql = sql.replace(paramRegex, () => {
        pIdx++;
        return '$' + pIdx;
    });
    const paramArray = params.map(p => p).join(', ');
    return 'poolNeon.query(`' + newSql + '`, [' + paramArray + '])';
});

fs.writeFileSync('backend/routes/chat.js', c, 'utf8');
console.log('Conversao chat.js concluida.');