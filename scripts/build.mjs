import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { renderPage, recordYear } from './site.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(resolve(root, 'data/achievements.json'), 'utf8'));
const html = renderPage(data);
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/index.html'), html);
for (const file of ['styles.css', 'filter.js', 'favicon.svg']) {
  await copyFile(resolve(root, 'public', file), resolve(root, 'dist', file));
}
await writeFile(resolve(root, 'dist/.nojekyll'), '');
const counts = Object.fromEntries([...new Set(data.records.map(recordYear))].sort().reverse()
  .map((year) => [year, data.records.filter((record) => recordYear(record) === year).length]));
console.log(`Built ${data.records.length} research outputs. Years: ${JSON.stringify(counts)}`);
