import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { categories, validateData, recordYear, formatDate, renderPage } from '../scripts/site.mjs';

const root = new URL('../', import.meta.url);
const data = JSON.parse(await readFile(new URL('data/achievements.json', root), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('sources/t2r2/2026-10-18/manifest.json', root), 'utf8'));
const sourceIds = manifest.files.filter(({ file }) => /^CTT\d+\.html$/.test(file)).map(({ file }) => file.slice(0, -5));
const imported = data.records.filter(({ id }) => sourceIds.includes(id));

test('all 16 imported records remain present with the original category and year totals', () => {
  validateData(data);
  assert.equal(sourceIds.length, 16);
  assert.equal(imported.length, 16);
  assert.deepEqual(categories.map(({ id }) => imported.filter((record) => record.category === id).length), [2, 3, 7, 4]);
  assert.deepEqual(['2026', '2025', '2024'].map((year) => imported.filter((record) => recordYear(record) === year).length), [5, 3, 8]);
});

test('patent years use registration/publication dates rather than filing dates', () => {
  assert.equal(recordYear(data.records.find(({ id }) => id === 'CTT100932502')), '2025');
  assert.equal(recordYear(data.records.find(({ id }) => id === 'CTT100943687')), '2026');
  assert.equal(recordYear(data.records.find(({ id }) => id === 'CTT100928459')), '2024');
});

test('the HTML contains every record without JavaScript and preserves date precision', () => {
  const html = renderPage(data);
  assert.equal((html.match(/class="record"/g) || []).length, data.records.length);
  assert.equal((html.match(/class="authors">.*?<strong>/g) || []).length, data.records.length);
  assert.match(html, /data-filter="all" aria-pressed="true"/);
  assert.match(html, /datetime="2025-11">Nov 2025/);
  assert.equal(formatDate('2025'), '2025');
  assert.equal(formatDate('2025-03'), 'Mar 2025');
  assert.equal(formatDate('2026-04-14'), 'Apr 14, 2026');
  assert.match(html, /BaZr0\.9Y0\.1O3-δ/);
});

test('same-day records keep source order and shared patent publication numbers stay separate', () => {
  const html = renderPage(data);
  assert.ok(html.indexOf('id="CTT100943687"') < html.indexOf('id="CTT100943688"'));
  assert.ok(html.indexOf('id="CTT100932502"') < html.indexOf('id="CTT100928459"'));
  assert.equal((html.match(/WO 2024\/190513/g) || []).length, 2);
});

test('invalid dates, duplicate IDs, missing owner names and unsafe links stop the build', () => {
  for (const mutate of [
    (copy) => { copy.records[0].date = '2026-02-30'; },
    (copy) => { copy.records[1].id = copy.records[0].id; },
    (copy) => { copy.records[0].authors = ['Someone Else']; },
    (copy) => { copy.records[0].links[0].url = 'javascript:alert(1)'; },
  ]) {
    const copy = structuredClone(data);
    mutate(copy);
    assert.throws(() => validateData(copy));
  }
});

test('source text is escaped when rendered as HTML', () => {
  const copy = structuredClone(data);
  copy.records[0].title = '<img src=x onerror="alert(1)"> & research';
  const html = renderPage(copy);
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; research'));
  assert.ok(!html.includes('<img src=x'));
});

test('every original source archive matches its saved SHA-256', async () => {
  for (const source of manifest.files) {
    const bytes = await readFile(new URL(`sources/t2r2/2026-10-18/${source.file}`, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, source.file);
  }
  for (const record of data.records) {
    await readFile(new URL(record.source.archive, root));
    for (const extra of record.source.additional || []) await readFile(new URL(extra.archive, root));
  }
});
