const fs = require('fs');
const path = require('path');

function searchMock(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchMock(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('mock') || content.includes('Mock')) {
        console.log(`Mock found in: ${full}`);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes('mock') || l.includes('Mock')) {
            console.log(`  L${i+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

searchMock('c:\\Users\\HP\\.antigravity-ide\\Izifacturation\\components');
searchMock('c:\\Users\\HP\\.antigravity-ide\\Izifacturation\\app');
