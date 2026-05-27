const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..');
const files = [
  'games/arkanoid/index.html',
  'games/block-blast/index.html',
  'games/sokoban/index.html',
  'games/sokoban-master/index.html',
  'games/tetris/index.html',
  'games/puzzle-bubble/index.html',
  'games/pacman-maze/index.html',
  'games/zuma/index.html',
  'games/super-mario/index.html',
  'games/pacman/index.html',
];

files.forEach(rel => {
  const f = path.join(base, rel);
  let c = fs.readFileSync(f, 'utf8');
  const orig = c.length;

  // Remove unused gameEngine.js script tag
  c = c.replace(/\s*<script src="\.\.\/\.\.\/engine\/gameEngine\.js"><\/script>/g, '');

  // Fix game-container: white bg → dark
  c = c.replace(/background:\s*linear-gradient\(145deg,\s*#ffffff[^)]+\)/g, 'background: rgba(10,10,20,0.92)');
  c = c.replace(/background:\s*linear-gradient\(145deg,\s*#fff[^)]+\)/g, 'background: rgba(10,10,20,0.92)');

  // Fix controls-panel and control-item backgrounds
  c = c.replace(/background:\s*#f8f9fa/g, 'background: rgba(255,255,255,0.05)');
  c = c.replace(/background:\s*white\b/g, 'background: rgba(255,255,255,0.07)');
  c = c.replace(/background:\s*#fff\b(?!;?\s*\))/g, 'background: rgba(255,255,255,0.07)');

  fs.writeFileSync(f, c, 'utf8');
  console.log(`${rel}: ${orig} -> ${c.length} bytes`);
});

console.log('All done.');
