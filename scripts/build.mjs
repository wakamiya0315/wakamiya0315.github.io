import { readFile, mkdir, writeFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { renderPage, recordYear } from './site.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(resolve(root, 'data/achievements.json'), 'utf8'));
const html = renderPage(data);
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/index.html'), html);
await cp(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/.nojekyll'), '');
const counts = Object.fromEntries([...new Set(data.records.map(recordYear))].sort().reverse()
  .map((year) => [year, data.records.filter((record) => recordYear(record) === year).length]));
console.log(`Built ${data.records.length} research outputs. Years: ${JSON.stringify(counts)}`);
