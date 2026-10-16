const fs = require('fs');
let c = fs.readFileSync('backend/routes/chat.js', 'utf8');
c = c.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// 1. Corrigir poolNeon) seguido de .query( em linha separada
c = c.replace(/poolNeon\)\s*\n\s*\.query\(/g, 'poolNeon.query(');

// 2. Substituir OUTPUT INSERTED.* por RETURNING *
c = c.replace(/OUTPUT INSERTED\.\*/g, 'RETURNING *');

// 3. Substituir OUTPUT INSERTED.col por RETURNING col
c = c.replace(/OUTPUT INSERTED\.([a-zA-Z_]+)/g, 'RETURNING $1');

// 4. Processar blocos .query() para @param -> $N (incluindo os que estavam em linhas separadas)
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
console.log('Correcao chat.js concluida.');