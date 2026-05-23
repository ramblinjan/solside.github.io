// Data injected by Jekyll — see schedule.html script block
// INSTRUCTORS_ARR, RECURRING, WORKSHOPS

const INSTRUCTORS = {};
INSTRUCTORS_ARR.forEach(i => (INSTRUCTORS[i.id] = i));

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

  document.getElementById('week-month-label').textContent = 'June 2026 Schedule';

  document.getElementById('qr-link').href = 'https://thesolside.com/schedule';
  document.getElementById('qr-code').src =
    'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://thesolside.com/schedule';

  document.getElementById('schedule-output').innerHTML =
    DAY_ORDER.filter(d => byDay[d] || workshopsByDay[d]).map(day => {
      const workshopItems = (workshopsByDay[day] || []).map(w => {
        const shortDate = new Date(w.date + 'T00:00:00')
          .toLocaleString('en-US', { month: 'short', day: 'numeric' });
        const instructor = INSTRUCTORS[w.instructor_id]?.name ?? w.instructor_id ?? '';
        return `
          <li class="event event--workshop">
            <span class="event__time"><span class="event__badge">${shortDate}</span></span>
            <div class="event__body">
              <span class="event__name">${w.time ? formatTime(w.time) + ' \u00b7 ' : ''}${w.title}</span>
              <span class="event__with">${instructor}</span>
            </div>
          </li>`;
      }).join('');

      const recurringItems = (byDay[day] || []).map(r => `
        <li class="event">
          <span class="event__time"><span class="event__badge event__badge--time">${formatTime(r.time)}</span></span>
          <div class="event__body">
            <span class="event__name">${r.title}</span>
            <span class="event__with">${INSTRUCTORS[r.instructor_id]?.name ?? r.instructor_id}</span>
          </div>
        </li>`).join('');

      return `
        <div class="schedule__day-group">
          <h3 class="schedule__day">${day}</h3>
          <ul class="events">${workshopItems}${recurringItems}</ul>
        </div>`;
    }).join('');
}

// ── Print ───────────────────────────────────────────────────────────────────

document.getElementById('print-btn').addEventListener('click', () => window.print());

// ── Init ────────────────────────────────────────────────────────────────────

render();
