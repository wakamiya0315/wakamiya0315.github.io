export const categories = [
  { id: 'journal', label: 'Journal Articles', short: 'Journal articles' },
  { id: 'international-conference', label: 'International Conferences', short: 'International conferences' },
  { id: 'domestic-conference', label: 'Domestic Conferences', short: 'Domestic conferences' },
  { id: 'patent', label: 'Patents', short: 'Patents' },
];

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return false;
  const [year, month = '01', day = '01'] = value.split('-');
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(`${year}-${month}-${day}`);
}

function validUrl(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export function recordDate(record) {
  return record.category === 'patent'
    ? record.patent[record.patent.status === 'registered' ? 'registrationDate' : 'publicationDate']
    : record.date;
}

export function recordYear(record) {
  return recordDate(record).slice(0, 4);
}

export function validateData(data) {
  assert(data?.site?.name && Array.isArray(data.site.authorAliases), 'Missing site name or author aliases');
  assert(validDate(data.site.updated), 'Invalid site updated date');
  for (const field of ['url', 'githubUrl', 'sourceUrl']) assert(validUrl(data.site[field]), `Invalid site ${field}`);
  assert(Array.isArray(data.records) && data.records.length > 0, 'No achievement records');
  const ids = new Set();
  for (const record of data.records) {
    const prefix = record.id || 'Unknown record';
    assert(typeof record.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(record.id), `${prefix}: invalid ID`);
    assert(!ids.has(record.id), `${prefix}: duplicate ID`);
    ids.add(record.id);
    assert(categories.some(({ id }) => id === record.category), `${prefix}: invalid category`);
    assert(typeof record.title === 'string' && record.title.trim(), `${prefix}: missing title`);
    assert(['en', 'ja'].includes(record.titleLanguage), `${prefix}: invalid title language`);
    assert(Array.isArray(record.authors) && record.authors.length > 0 && record.authors.every((name) => typeof name === 'string' && name.trim()), `${prefix}: missing authors`);
    assert(record.authors.some((name) => data.site.authorAliases.includes(name)), `${prefix}: owner missing from authors`);
    assert(validUrl(record.source?.url) && validDate(record.source?.accessedDate), `${prefix}: invalid source`);
    assert(Array.isArray(record.links) && record.links.every((link) => link.label && validUrl(link.url)), `${prefix}: invalid related link`);
    if (record.category === 'patent') {
      const patent = record.patent;
      assert(patent && ['published', 'registered'].includes(patent.status), `${prefix}: invalid patent status`);
      for (const field of ['applicant', 'applicationNumber', 'publicationNumber']) assert(patent[field], `${prefix}: missing ${field}`);
      for (const field of ['filingDate', 'publicationDate']) assert(validDate(patent[field]), `${prefix}: invalid ${field}`);
      if (patent.status === 'registered') {
        assert(validDate(patent.registrationDate) && patent.registrationNumber, `${prefix}: missing registration date or number`);
      }
    } else {
      assert(validDate(record.date) && record.venue, `${prefix}: invalid date or venue`);
    }
  }
  return data;
}

export function formatDate(value, full = false) {
  const [year, month, day] = value.split('-');
  if (!month) return year;
  const date = new Date(`${year}-${month}-${day || '01'}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: full ? 'long' : 'short', ...(day ? { day: 'numeric' } : {}), timeZone: 'UTC',
  }).format(date);
}

function renderRecord(record, aliases) {
  const e = escapeHtml;
  const date = recordDate(record);
  const authors = record.authors.map((name) => aliases.includes(name) ? `<strong>${e(name)}</strong>` : e(name)).join(', ');
  const relatedLinks = [...record.links, { label: 'T2R2 record', url: record.source.url }]
    .map((link) => `<a href="${e(link.url)}">${e(link.label)} <span aria-hidden="true">↗</span></a>`).join('');
  let metadata;
  let extra = '';
  if (record.category === 'patent') {
    const patent = record.patent;
    const fields = [
      ['Application', `${patent.applicationNumber} · filed ${formatDate(patent.filingDate)}`],
      ['Publication', `${patent.publicationNumber} · ${formatDate(patent.publicationDate)}`],
      ...(patent.status === 'registered' ? [['Registration', `${patent.registrationNumber} · ${formatDate(patent.registrationDate)}`]] : []),
    ];
    metadata = `<span class="patent-status">${patent.status === 'registered' ? 'Registered' : 'Published'}</span>`;
    extra = `<dl class="patent-details">${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>`;
  } else {
    const volume = record.volume ? ` · Vol. ${e(record.volume)}${record.issue ? `, No. ${e(record.issue)}` : ''}` : '';
    metadata = `<span${/[\u3040-\u9fff]/.test(record.venue) ? ' lang="ja"' : ''}>${e(record.venue)}</span>${volume}`;
    if (record.award) extra = `<p class="award"><span aria-hidden="true">◇</span> ${e(record.award)}</p>`;
  }
  return `<li class="record" id="${e(record.id)}" data-year="${recordYear(record)}">
    <div class="record-date"><time datetime="${date}">${e(formatDate(date))}</time></div>
    <article class="record-body" aria-labelledby="title-${e(record.id)}">
      <h3 id="title-${e(record.id)}" lang="${record.titleLanguage}">${e(record.title)}</h3>
      <p class="authors">${authors}</p>
      <p class="venue">${metadata}</p>${extra}
      <div class="record-links">${relatedLinks}</div>
    </article>
  </li>`;
}

export function renderPage(data) {
  validateData(data);
  const e = escapeHtml;
  const { site, records } = data;
  const years = [...new Set(records.map(recordYear))].sort().reverse();
  const navigation = categories.map((category) => {
    const count = records.filter((record) => record.category === category.id).length;
    return count ? `<a href="#${category.id}" data-category-link="${category.id}"><span>${category.short}</span><span class="nav-count">${count}</span></a>` : '';
  }).join('');
  const sections = categories.map((category, index) => {
    const entries = records.filter((record) => record.category === category.id)
      .sort((a, b) => recordDate(b).localeCompare(recordDate(a)));
    if (!entries.length) return '';
    return `<section id="${category.id}" class="category" data-category="${category.id}" aria-labelledby="heading-${category.id}">
      <header class="section-heading"><span class="section-number" aria-hidden="true">0${index + 1}</span><h2 id="heading-${category.id}">${category.label}</h2><span class="section-count" aria-label="${entries.length} records">${entries.length}</span></header>
      <ol class="records">${entries.map((record) => renderRecord(record, site.authorAliases)).join('\n')}</ol>
    </section>`;
  }).join('\n');
  const description = `Journal articles, conference presentations, and patents by ${site.name}.`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${e(description)}">
  <meta name="theme-color" content="#fafbfc">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${e(site.name)} — Research Outputs">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${e(site.url)}">
  <title>${e(site.name)} — Research Outputs</title>
  <link rel="canonical" href="${e(site.url)}">
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="./styles.css">
  <script src="./filter.js" defer></script>
</head>
<body id="top">
  <a class="skip-link" href="#outputs">Skip to research outputs</a>
  <div class="page">
    <header class="page-header">
      <div class="header-topline"><p class="eyebrow">Research outputs</p><a class="github-link" href="${e(site.githubUrl)}">GitHub <span aria-hidden="true">↗</span></a></div>
      <h1>${e(site.name)}</h1>
      <div class="filter-bar">
        <div class="year-filter" aria-label="Filter research outputs by year" role="group" hidden>
          <button type="button" class="year-button" data-filter="all" aria-pressed="true">All <span>${records.length}</span></button>
          ${years.map((year) => `<button type="button" class="year-button" data-filter="${year}" aria-pressed="false">${year} <span>${records.filter((record) => recordYear(record) === year).length}</span></button>`).join('\n')}
        </div>
        <p class="result-status" role="status" aria-live="polite" aria-atomic="true">Showing all ${records.length} outputs</p>
      </div>
    </header>
    <div class="content-layout">
      <aside class="browse"><nav aria-label="Output categories"><p class="eyebrow">Browse by type</p>${navigation}</nav></aside>
      <main id="outputs" tabindex="-1">${sections}</main>
    </div>
    <footer class="page-footer"><p>Last updated ${e(formatDate(site.updated, true))}</p><p>Records migrated from <a href="${e(site.sourceUrl)}">T2R2</a> · <a href="#top" aria-label="Back to top">Back to top ↑</a></p></footer>
  </div>
</body>
</html>\n`;
}
