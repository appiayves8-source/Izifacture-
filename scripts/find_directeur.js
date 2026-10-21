const fs = require('fs');
const path = require('path');

function searchFiles(dir, term) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.next' || f === '.git') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchFiles(full, term);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.toLowerCase().includes(term.toLowerCase())) {
        console.log(`Found in: ${full}`);
      }
    }
  }
}

searchFiles('c:\\Users\\HP\\.antigravity-ide\\Izifacturation', 'directeur');
