const fs = require('fs');
let c = fs.readFileSync('backend/routes/chat.js', 'utf8');
c = c.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// 1. Corrigir OUTPUT INSERTED.* em linhas separadas
// Padrão: OUTPUT\n                    INSERTED.id,\n                    INSERTED.col2,\n...
// Substituir por: RETURNING id,\n                    col2,\n...
c = c.replace(/OUTPUT\s*\n\s*INSERTED\.([a-zA-Z_]+)/g, 'RETURNING $1');
c = c.replace(/INSERTED\.([a-zA-Z_]+)/g, '$1');

// 2. Remover linhas isoladas de "OUTPUT" que sobraram
c = c.replace(/^\s*OUTPUT\s*\n/gm, '');

// 3. Processar blocos .query() para @param -> $N (casos restantes)
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
console.log('Correcao 5 concluida.');