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

// "5:00–6:15 pm" when start/end share a period, "11:00 am–12:00 pm" when they cross.
function formatTimeRange(start, durationMin) {
  if (!start) return '';
  if (!durationMin) return formatTime(start);
  const { h, m } = parseTime(start);
  const startTotal = h * 60 + m;
  const endTotal = startTotal + durationMin;
  const endStr = `${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
  const startPeriod = h >= 12 ? 'pm' : 'am';
  const endPeriod = Math.floor(endTotal / 60) % 24 >= 12 ? 'pm' : 'am';
  const startBare = formatTime(start).replace(/ (am|pm)$/, '');
  if (startPeriod === endPeriod) {
    return `${startBare}–${formatTime(endStr)}`;
  }
  return `${startBare} ${startPeriod}–${formatTime(endStr)}`;
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

function taglineEl(short) {
  return short ? `<span class="event__tagline">${short}</span>` : '';
}

function metaLine(audience, price, note) {
  const parts = [];
  if (note) parts.push(`<span class="event__tag event__tag--note">${note}</span>`);
  if (audience) parts.push(`<span class="event__tag">${audience}</span>`);
  if (price) parts.push(`<span class="event__price">${price}</span>`);
  return parts.length ? `<div class="event__meta">${parts.join('')}</div>` : '';
}

function registerLine(phone, email) {
  const contacts = [
    phone ? `<a href="tel:+1${phone.replace(/\D/g, '')}">${phone}</a>` : '',
    email ? `<a href="mailto:${email}">${email}</a>` : '',
  ].filter(Boolean).join(' · ');
  return `
            <div class="event__register"><strong class="event__register-label">No Drop-Ins, Preregister Only</strong>${
              contacts ? `<br>${contacts}` : ''
            }</div>`;
}

function sectionTitle(t) {
  return `<h2 class="schedule__section-title">${t}</h2>`;
}

// ── Render ──────────────────────────────────────────────────────────────────

function render() {
  const ym = '2026-07';
  const DAY_ORDER = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const byDay = {};
  RECURRING.filter(r => r.month === ym).forEach(r => {
    (byDay[r.day] = byDay[r.day] || []).push(r);
  });
  Object.values(byDay).forEach(arr =>
    arr.sort((a, b) => parseTime(a.time).sort - parseTime(b.time).sort)
  );

  const labelEl = document.getElementById('week-month-label');
  if (labelEl) labelEl.textContent = 'July 2026 Schedule';

  const qrLink = document.getElementById('qr-link');
  const qrCode = document.getElementById('qr-code');
  if (qrLink) qrLink.href = 'https://thesolside.com/schedule';
  if (qrCode) qrCode.src = '/assets/images/schedule-qr.png';

  // ── Weekly recurring classes, grouped by weekday ──────────────────────────
  const weeklyHtml = DAY_ORDER.filter(d => byDay[d]).map(day => {
    const items = byDay[day].map(r => {
      const cls = CLASSES[r.class_id] || {};
      const title = r.title || cls.title;
      const url = r.url || cls.url;
      const short_description = r.short_description || cls.short_description;
      const description = r.description || cls.description || short_description;
      const instructor_id = r.instructor_id || cls.instructor_id;
      const duration_min = r.duration_min || cls.duration_min;
      const phone = r.register_phone || cls.register_phone;
      const email = r.register_email || cls.register_email;
      const audience = r.audience || cls.audience;
      const isPrereg = !url && (phone || email);
      return `
        <li class="event">
          <span class="event__time"><span class="event__badge event__badge--time">${formatTimeRange(r.time, duration_min)}</span></span>
          <div class="event__body">
            <span class="event__name"${tooltipAttrs(description)}>${makeTitle(title, url, isPrereg ? null : description)}</span>
            <span class="event__with">${INSTRUCTORS[instructor_id]?.name ?? instructor_id}</span>${taglineEl(short_description)}${metaLine(audience, null, r.note)}${isPrereg ? registerLine(phone, email) : ''}
          </div>
        </li>`;
    }).join('');
    return `
      <div class="schedule__day-group">
        <h3 class="schedule__day">${day}</h3>
        <ul class="events">${items}</ul>
      </div>`;
  }).join('');

  // ── Special events / workshops, grouped per date into cards ───────────────
  const byDate = {};
  WORKSHOPS.filter(w => w.date.startsWith(ym)).forEach(w => {
    (byDate[w.date] = byDate[w.date] || []).push(w);
  });

  const cardsHtml = Object.keys(byDate).sort().map(date => {
    const d = new Date(date + 'T00:00:00');
    const weekday = d.toLocaleString('en-US', { weekday: 'long' });
    const md = d.toLocaleString('en-US', { month: 'long', day: 'numeric' });
    const items = byDate[date]
      .sort((a, b) => parseTime(a.time || '0:0').sort - parseTime(b.time || '0:0').sort)
      .map(w => {
        const instructor = INSTRUCTORS[w.instructor_id]?.name ?? w.instructor_id ?? '';
        const timeStr = w.time ? formatTimeRange(w.time, w.duration_min) + ' · ' : '';
        const wDesc = w.description || w.short_description;
        return `
            <li class="event-card__item">
              <span class="event__name"${tooltipAttrs(wDesc)}>${makeTitle(timeStr + w.title, w.url, wDesc)}</span>
              <span class="event__with">${instructor}</span>${metaLine(w.audience, w.price)}
            </li>`;
      }).join('');
    return `
        <article class="event-card">
          <h4 class="event-card__date">${weekday} · ${md}</h4>
          <ul class="event-card__list">${items}</ul>
        </article>`;
  }).join('');

  document.getElementById('schedule-output').innerHTML = `
    <div class="schedule-layout">
      <div class="schedule-col schedule-col--weekly">
        ${sectionTitle('Weekly Classes')}
        ${weeklyHtml}
      </div>${cardsHtml ? `
      <aside class="schedule-col schedule-col--special">
        ${sectionTitle('Special Events')}
        ${cardsHtml}
      </aside>` : ''}
    </div>`;
}

// ── Print ───────────────────────────────────────────────────────────────────

document.getElementById('print-btn')?.addEventListener('click', () => window.print());

// ── Init ────────────────────────────────────────────────────────────────────

render();
