import fs from 'fs';
import path from 'path';

const root = process.cwd();
const globalsPath = path.join(root, 'app', 'globals.css');

if (!fs.existsSync(globalsPath)) {
  console.error('ERRO: app/globals.css não encontrado. Rode este script dentro de C:\\tbh-site');
  process.exit(1);
}

const start = '/* TBH_COMPACT_UI_START */';
const end = '/* TBH_COMPACT_UI_END */';

const css = `${start}
/* Compacta o site inteiro para evitar menus/cards cortando em telas menores. */
:root {
  --tbh-compact-scale: 0.80;
}

@media (min-width: 1024px) {
  body {
    zoom: var(--tbh-compact-scale);
  }
}

/* Fallback para navegadores sem suporte confiável a zoom. */
@supports not (zoom: 1) {
  @media (min-width: 1024px) {
    body {
      transform: scale(0.80);
      transform-origin: top left;
      width: 125%;
      min-height: 125vh;
      overflow-x: hidden;
    }
  }
}

/* Menus e grids ficam mais compactos sem perder o estilo pixelado. */
@media (min-width: 1024px) {
  header, nav, aside, main {
    box-sizing: border-box;
  }

  button, a, input, select {
    box-sizing: border-box;
  }
}
${end}`;

let current = fs.readFileSync(globalsPath, 'utf8');

const backupPath = globalsPath + '.backup-before-compact-ui';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, current, 'utf8');
}

const pattern = new RegExp(`${start}[\\s\\S]*?${end}`, 'm');
if (pattern.test(current)) {
  current = current.replace(pattern, css);
} else {
  current = current.trimEnd() + '\n\n' + css + '\n';
}

fs.writeFileSync(globalsPath, current, 'utf8');
console.log('Compact UI aplicado em app/globals.css');
console.log('Escala atual: 80%');
console.log('Para ajustar depois, edite --tbh-compact-scale em app/globals.css');
