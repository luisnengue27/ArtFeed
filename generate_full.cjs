const fs = require("fs");
const content = `USE_STRICT_PLACEHOLDER`;
fs.writeFileSync("backend/routes/artistas.js", content, "utf8");
console.log("Arquivo gerado.");

