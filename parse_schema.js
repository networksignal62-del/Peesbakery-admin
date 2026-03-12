const fs = require('fs');

const data = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

let out = '';
if (data.definitions) {
  for (const [tableName, definition] of Object.entries(data.definitions)) {
    out += `\nTable: ${tableName}\n`;
    if (definition.properties) {
      for (const [colName, colDef] of Object.entries(definition.properties)) {
         out += `  - ${colName}: ${colDef.type || colDef.format}\n`;
      }
    }
  }
}
fs.writeFileSync('schema_parsed.txt', out);
