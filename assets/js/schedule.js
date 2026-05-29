// Data injected by Jekyll — see schedule.html script block
// INSTRUCTORS_ARR, RECURRING, WORKSHOPS

const INSTRUCTORS = {};
INSTRUCTORS_ARR.forEach(i => (INSTRUCTORS[i.id] = i));

const CLASSES = {};
CLASSES_ARR.forEach(c => (CLASSES[c.id] = c));

// ── Utilities ───────────────────────────────────────────────────────────────

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return { h, m, sort: h * 100 + m };
}

function formatTime(str) {
  if (!str) return '';
  const { h, m } = parseTime(str);
  const period = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  const min = `:${String(m).padStart(2, '0')}`;
  return `${hour}${min} ${period}`;
}

function escAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tooltipAttrs(desc) {
  return desc ? ` data-tooltip="${escAttr(desc)}"` : '';
}

const CALENDAR_SVG = `<svg class="event__icon-cal" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3.9 3 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>`;

function makeTitle(title, url, desc) {
  if (url) {
    return `<a class="event__link" href="${url}" target="_blank" rel="noopener noreferrer">${title} ${CALENDAR_SVG}</a>`;
  }
  const icon = desc ? ' <span class="event__info" aria-hidden="true">ⓘ</span>' : '';
  return title + icon;
}

// ── Render ──────────────────────────────────────────────────────────────────

function render() {
  const ym = '2026-06';
  const DAY_ORDER = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const byDay = {};
  RECURRING.filter(r => r.month === ym).forEach(r => {
    (byDay[r.day] = byDay[r.day] || []).push(r);
  });
  Object.values(byDay).forEach(arr =>
    arr.sort((a, b) => parseTime(a.time).sort - parseTime(b.time).sort)
  );

  const workshopsByDay = {};
  WORKSHOPS
    .filter(w => w.date.startsWith(ym))
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(w => {
      const dayName = DAY_ORDER[new Date(w.date + 'T00:00:00').getDay()];
      (workshopsByDay[dayName] = workshopsByDay[dayName] || []).push(w);
    });

  const labelEl = document.getElementById('week-month-label');
  if (labelEl) labelEl.textContent = 'June 2026 Schedule';

  const qrLink = document.getElementById('qr-link');
  const qrCode = document.getElementById('qr-code');
  if (qrLink) qrLink.href = 'https://thesolside.com/schedule';
  if (qrCode) qrCode.src = '/assets/images/schedule-qr.png';

  document.getElementById('schedule-output').innerHTML =
    DAY_ORDER.filter(d => byDay[d] || workshopsByDay[d]).map(day => {
      const workshopItems = (workshopsByDay[day] || []).map(w => {
        const shortDate = new Date(w.date + 'T00:00:00')
          .toLocaleString('en-US', { month: 'short', day: 'numeric' });
        const instructor = INSTRUCTORS[w.instructor_id]?.name ?? w.instructor_id ?? '';
        const titleText = `${w.time ? formatTime(w.time) + ' \u00b7 ' : ''}${w.title}`;
        const wDesc = w.description || w.short_description;
        const wTagline = w.short_description
          ? `<span class="event__tagline">${w.short_description}</span>` : '';
        return `
          <li class="event event--workshop">
            <span class="event__time"><span class="event__badge">${shortDate}</span></span>
            <div class="event__body">
              <span class="event__name"${tooltipAttrs(wDesc)}>${makeTitle(titleText, w.url, wDesc)}</span>
              <span class="event__with">${instructor}</span>${wTagline}
            </div>
          </li>`;
      }).join('');

      const recurringItems = (byDay[day] || []).map(r => {
        const cls = CLASSES[r.class_id] || {};
        const title = r.title || cls.title;
        const url = r.url || cls.url;
        const short_description = r.short_description || cls.short_description;
        const description = r.description || cls.description || short_description;
        const instructor_id = r.instructor_id || cls.instructor_id;
        const tagline = short_description
          ? `<span class="event__tagline">${short_description}</span>` : '';
        return `
        <li class="event">
          <span class="event__time"><span class="event__badge event__badge--time">${formatTime(r.time)}</span></span>
          <div class="event__body">
            <span class="event__name"${tooltipAttrs(description)}>${makeTitle(title, url, description)}</span>
            <span class="event__with">${INSTRUCTORS[instructor_id]?.name ?? instructor_id}</span>${tagline}
          </div>
        </li>`;
      }).join('');

      return `
        <div class="schedule__day-group">
          <h3 class="schedule__day">${day}</h3>
          <ul class="events">${workshopItems}${recurringItems}</ul>
        </div>`;
    }).join('');
}

// ── Print ───────────────────────────────────────────────────────────────────

document.getElementById('print-btn')?.addEventListener('click', () => window.print());

// ── Init ────────────────────────────────────────────────────────────────────

render();
