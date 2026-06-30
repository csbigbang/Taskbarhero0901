import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const cwd = process.cwd();
const defaultSource = process.platform === 'win32' ? 'C:\\imagens-thb\\Assets' : '/mnt/data/Assets';
const sourceArg = process.argv[2] || defaultSource;
const sourceRoot = path.resolve(sourceArg);
const outRoot = path.join(cwd, 'public', 'game-assets');
const manifestPath = path.join(outRoot, 'manifest.json');

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function existsDir(p) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function sanitizeBaseName(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const base = path.basename(fileName, ext)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'asset';
  return { base, ext };
}

function categoryFor(rel, fileName) {
  const low = `${rel}/${fileName}`.toLowerCase();

  if (/item_\d+/.test(low) || /item|inventory|equipment|equip|gear|weapon|armor|material|ruby|sapphire|topaz|amethyst|emerald|jade|obsidian|coral|ring|necklace|helmet|boots|glove|gloves|shield|bow|sword|staff|wand|rune/.test(low)) {
    return 'items';
  }
  if (/skill|passive|buff|status|effect/.test(low)) return 'skills';
  if (/hero|character|pet|player/.test(low)) return 'heroes';
  if (/monster|boss|zombie|yeti|goblin|slime|demon|rat|wolf|spider|skeleton|orc|dragon/.test(low)) return 'monsters';
  if (/stage|map|field|portal|act|dungeon|background|bg_/.test(low)) return 'stages';
  if (/ui|button|panel|window|frame|slot|gauge|bar|icon|menu|cursor|check|warning|popup|modal|chest|shop|craft|cube/.test(low)) return 'ui';
  if (/font|logo|title|banner/.test(low)) return 'branding';
  return 'misc';
}

function relUrl(...parts) {
  return '/' + parts.map((p) => String(p).replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
}

if (!existsDir(sourceRoot)) {
  console.error(`\nERRO: pasta fonte não encontrada: ${sourceRoot}`);
  console.error('Use assim: npm run assets:import "C:\\imagens-thb\\Assets"\n');
  process.exit(1);
}

fs.mkdirSync(outRoot, { recursive: true });

const files = walk(sourceRoot).filter((p) => IMAGE_EXTS.has(path.extname(p).toLowerCase()));
const used = new Set();
const manifest = [];
const counts = {};

for (const full of files) {
  const rel = path.relative(sourceRoot, full).replaceAll('\\', '/');
  const fileName = path.basename(full);
  const category = categoryFor(rel, fileName);
  const { base, ext } = sanitizeBaseName(fileName);
  const hash = crypto.createHash('sha1').update(rel).digest('hex').slice(0, 8);
  let outName = `${base}${ext}`;
  if (used.has(`${category}/${outName}`)) outName = `${base}-${hash}${ext}`;
  used.add(`${category}/${outName}`);

  const outDir = path.join(outRoot, category);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, outName);
  fs.copyFileSync(full, outPath);

  const stat = fs.statSync(full);
  manifest.push({
    id: `${category}-${hash}`,
    name: path.basename(outName, ext),
    category,
    url: relUrl('game-assets', category, outName),
    originalPath: rel,
    sizeBytes: stat.size
  });
  counts[category] = (counts[category] || 0) + 1;
}


// Também inclui ícones já extraídos em public/images/items no mesmo manifesto,
// assim Item_110001.png e similares são tratados como assets reais.
const localItemsDir = path.join(cwd, 'public', 'images', 'items');
if (existsDir(localItemsDir)) {
  for (const full of walk(localItemsDir).filter((p) => IMAGE_EXTS.has(path.extname(p).toLowerCase()))) {
    const fileName = path.basename(full);
    const { base, ext } = sanitizeBaseName(fileName);
    const rel = path.relative(cwd, full).replaceAll('\\', '/');
    const hash = crypto.createHash('sha1').update(`local-items:${rel}`).digest('hex').slice(0, 8);
    const key = `items/${base}${ext}`;
    if (used.has(key)) continue;
    used.add(key);
    const stat = fs.statSync(full);
    manifest.push({
      id: `items-${hash}`,
      name: base,
      category: 'items',
      url: relUrl('images', 'items', fileName),
      originalPath: rel,
      sizeBytes: stat.size
    });
    counts.items = (counts.items || 0) + 1;
  }
}

manifest.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
fs.writeFileSync(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), sourceRoot, total: manifest.length, counts, assets: manifest }, null, 2), 'utf8');

console.log('\nTBH asset import concluído.');
console.log(`Fonte: ${sourceRoot}`);
console.log(`Destino: ${outRoot}`);
console.log(`Manifest: ${manifestPath}`);
console.log(`Total de imagens: ${manifest.length}`);
for (const [cat, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`- ${cat}: ${count}`);
console.log('\nAbra no site: http://localhost:3000/assets\n');
