(() => {
  const controls = document.querySelector('.year-filter');
  const status = document.querySelector('.result-status');
  const sections = [...document.querySelectorAll('[data-category]')];
  const buttons = [...controls.querySelectorAll('[data-filter]')];

  function filterByYear(year) {
    let total = 0;
    for (const section of sections) {
      let count = 0;
      for (const record of section.querySelectorAll('[data-year]')) {
        const visible = year === 'all' || record.dataset.year === year;
        record.hidden = !visible;
        if (visible) count += 1;
      }
      section.hidden = count === 0;
      const link = document.querySelector(`[data-category-link="${section.dataset.category}"]`);
      if (link) {
        link.hidden = count === 0;
        link.querySelector('.nav-count').textContent = count;
      }
      const badge = section.querySelector('.section-count');
      badge.textContent = count;
      badge.setAttribute('aria-label', `${count} ${count === 1 ? 'record' : 'records'}`);
      total += count;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === year));
    status.textContent = year === 'all'
      ? `Showing all ${total} outputs`
      : `Showing ${total} ${total === 1 ? 'output' : 'outputs'} from ${year}`;
  }

  for (const button of buttons) button.addEventListener('click', () => filterByYear(button.dataset.filter));
  filterByYear('all');
  controls.hidden = false;
})();
