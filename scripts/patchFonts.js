const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..');
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@600;700&display=swap');\n";

const files = [
  'games/arkanoid/index.html',
  'games/sokoban/index.html',
  'games/sokoban-master/index.html',
  'games/tetris/index.html',
  'games/puzzle-bubble/index.html',
  'games/pacman-maze/index.html',
  'games/super-mario/index.html',
  'games/block-blast/index.html',
  'games/pacman/index.html',
];

files.forEach(rel => {
  const f = path.join(base, rel);
  let c = fs.readFileSync(f, 'utf8');

  // Insert font import at top of first <style> block
  if (!c.includes('Orbitron')) {
    c = c.replace('<style>', '<style>\n' + FONT_IMPORT);
  }

  // Add color:#fff to body if not present
  if (!c.includes('color:#fff') && !c.includes('color: #fff')) {
    c = c.replace(/body\s*\{([^}]*)\}/s, (m, inner) => {
      if (!inner.includes('color:') && !inner.includes('color :')) {
        return `body {${inner}  color: #fff;\n}`;
      }
      return m;
    });
  }

  // Update body font-family to include Rajdhani
  c = c.replace("font-family: 'Segoe UI'", "font-family: 'Rajdhani','Segoe UI',sans-serif");
  c = c.replace('font-family:\'Segoe UI\'', "font-family:'Rajdhani','Segoe UI',sans-serif");

  // Fix title fonts where they exist (game-title class)
  if (!c.includes("font-family: 'Orbitron'") && !c.includes("font-family:'Orbitron'")) {
    c = c.replace(/\.game-title\s*\{([^}]+?)font-size:\s*[^;]+;/g,
      (m) => m + "\n            font-family: 'Orbitron', monospace;");
  }

  fs.writeFileSync(f, c, 'utf8');
  console.log(rel + ' patched');
});

console.log('Font patches complete.');
