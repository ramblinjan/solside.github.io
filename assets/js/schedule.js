// Data injected by Jekyll — see schedule.html script block
// INSTRUCTORS_ARR, RECURRING, WORKSHOPS

const INSTRUCTORS = {};
INSTRUCTORS_ARR.forEach(i => (INSTRUCTORS[i.id] = i));

const DAY_TO_JS = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6
};

// ── Date utilities ──────────────────────────────────────────────────────────

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toYM(date) {
  return toYMD(date).slice(0, 7);
}

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return { h, m, sort: h * 100 + m };
}

function formatTime(str) {
  if (!str) return '';
  const { h, m } = parseTime(str);
  const period = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  const min = m ? `:${String(m).padStart(2, '0')}` : '';
  return `${hour}${min} ${period}`;
}

function formatWeekRange(monday) {
  const sunday = addDays(monday, 6);
  const ms = monday.toLocaleString('en-US', { month: 'short' });
  const me = sunday.toLocaleString('en-US', { month: 'short' });
  const ys = monday.getFullYear();
  const ye = sunday.getFullYear();
  if (ys !== ye)  return `${ms} ${monday.getDate()}, ${ys} – ${me} ${sunday.getDate()}, ${ye}`;
  if (ms !== me)  return `${ms} ${monday.getDate()} – ${me} ${sunday.getDate()}, ${ye}`;
  return `${ms} ${monday.getDate()}–${sunday.getDate()}, ${ye}`;
}

function formatDayHeading(date) {
  const wd = date.toLocaleString('en-US', { weekday: 'short' });
  const mo = date.toLocaleString('en-US', { month: 'short' });
  return `${wd} ${mo} ${date.getDate()}`;
}

// ── Data helpers ────────────────────────────────────────────────────────────

function getEventsForWeek(monday) {
  const events = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const ymd  = toYMD(date);
    const ym   = toYM(date);
    const jsDay = date.getDay();

    RECURRING.forEach(r => {
      if (r.month !== ym) return;
      if (DAY_TO_JS[r.day] !== jsDay) return;
      events.push({
        date, ymd,
        time: r.time,
        title: r.title,
        instructor: INSTRUCTORS[r.instructor_id]?.name ?? r.instructor_id,
        type: 'recurring',
      });
    });

    WORKSHOPS.forEach(w => {
      if (w.date !== ymd) return;
      events.push({
        date, ymd,
        time: w.time,
        title: w.title,
        instructor: INSTRUCTORS[w.instructor_id]?.name ?? w.instructor_id ?? '',
        description: w.description || '',
        type: 'workshop',
      });
    });
  }

  events.sort((a, b) =>
    a.ymd !== b.ymd
      ? a.ymd.localeCompare(b.ymd)
      : parseTime(a.time).sort - parseTime(b.time).sort
  );

  return events;
}

// ── Renderers ───────────────────────────────────────────────────────────────

function eventHTML(e) {
  const badge = e.type === 'workshop'
    ? '<span class="event__badge">workshop</span> '
    : '';
  const desc = e.type === 'workshop' && e.description
    ? `<span class="event__desc">${e.description}</span>`
    : '';
  return `
    <li class="event${e.type === 'workshop' ? ' event--workshop' : ''}">
      <span class="event__time">${formatTime(e.time)}</span>
      <div class="event__body">
        <span class="event__name">${badge}${e.title}</span>
        <span class="event__with">${e.instructor}</span>
        ${desc}
      </div>
    </li>`;
}

function renderWeek(weekStart) {
  const events = getEventsForWeek(weekStart);
  const output = document.getElementById('schedule-output');

  if (!events.length) {
    output.innerHTML = '<p class="schedule__empty">No classes scheduled for this week.</p>';
    return;
  }

  // Group by date
  const days = [];
  let current = null;
  events.forEach(e => {
    if (!current || current.ymd !== e.ymd) {
      current = { ymd: e.ymd, date: e.date, events: [] };
      days.push(current);
    }
    current.events.push(e);
  });

  output.innerHTML = days.map(({ date, events: es }) => `
    <div class="schedule__day-group">
      <h3 class="schedule__day">${formatDayHeading(date)}</h3>
      <ul class="events">${es.map(eventHTML).join('')}</ul>
    </div>`
  ).join('');
}

function renderMonthlyPrint(monday) {
  const ym = '2026-06'; // hardcoded until multi-month support
  const entries = RECURRING.filter(r => r.month === ym);

  const DAY_ORDER = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const byDay = {};
  entries.forEach(r => {
    (byDay[r.day] = byDay[r.day] || []).push(r);
  });
  Object.values(byDay).forEach(arr =>
    arr.sort((a, b) => parseTime(a.time).sort - parseTime(b.time).sort)
  );

  const monthWorkshops = WORKSHOPS
    .filter(w => w.date.startsWith(ym))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group workshops by day-of-week
  const workshopsByDay = {};
  monthWorkshops.forEach(w => {
    const jsDay = new Date(w.date + 'T00:00:00').getDay();
    const dayName = DAY_ORDER[jsDay];
    (workshopsByDay[dayName] = workshopsByDay[dayName] || []).push(w);
  });

  const container = document.getElementById('schedule-monthly-print');

  if (!entries.length && !monthWorkshops.length) {
    container.innerHTML = '';
    return;
  }

  const monthLabel = addDays(monday, 3).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('monthly-print-month').textContent = monthLabel;

  container.innerHTML = DAY_ORDER.filter(d => byDay[d] || workshopsByDay[d]).map(day => {
    const recurringItems = (byDay[day] || []).map(r => `
      <li class="event">
        <span class="event__time">${formatTime(r.time)}</span>
        <div class="event__body">
          <span class="event__name">${r.title}</span>
          <span class="event__with">${INSTRUCTORS[r.instructor_id]?.name ?? r.instructor_id}</span>
        </div>
      </li>`).join('');

    const workshopItems = (workshopsByDay[day] || []).map(w => {
      const dateObj = new Date(w.date + 'T00:00:00');
      const shortDate = dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      const instructor = INSTRUCTORS[w.instructor_id]?.name ?? w.instructor_id ?? '';
      return `
        <li class="event">
          <span class="event__time">${shortDate}</span>
          <div class="event__body">
            <span class="event__name">${w.time ? formatTime(w.time) + ' \u00b7 ' : ''}${w.title}</span>
            <span class="event__with">${instructor}</span>
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

// ── Navigation ──────────────────────────────────────────────────────────────

// Clamp to June 2026 schedule range (May 31 – Jun 28 week starts)
const JUNE_START = new Date('2026-05-31T00:00:00');
const JUNE_END   = new Date('2026-06-28T00:00:00');

function clampToJune(date) {
  if (date < JUNE_START || date > JUNE_END) return new Date(JUNE_START);
  return date;
}

let currentWeekStart;

function navigate(delta) {
  currentWeekStart = clampToJune(addDays(currentWeekStart, delta * 7));
  update();
}

function update() {
  document.getElementById('week-range').textContent = formatWeekRange(currentWeekStart);
  const midWeek = addDays(currentWeekStart, 3); // Wednesday — determines displayed month
  document.getElementById('week-month-label').textContent =
    midWeek.toLocaleString('en-US', { month: 'long', year: 'numeric' }) + ' Schedule';
  const weekYMD = toYMD(currentWeekStart);
  history.replaceState(null, '', '#' + weekYMD);

  const scheduleURL = `https://thesolside.com/schedule#${weekYMD}`;
  document.getElementById('qr-link').href = scheduleURL;
  document.getElementById('qr-code').src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scheduleURL)}&bgcolor=fdfaf6&color=2e2a25`;

  renderWeek(currentWeekStart);
  renderMonthlyPrint(currentWeekStart);
}

// ── View toggle ─────────────────────────────────────────────────────────────

let currentView = 'weekly';

function switchView(view) {
  currentView = view;
  document.getElementById('view-weekly-btn').classList.toggle('view-toggle__btn--active', view === 'weekly');
  document.getElementById('view-monthly-btn').classList.toggle('view-toggle__btn--active', view === 'monthly');
  document.getElementById('schedule-output').classList.toggle('schedule--hidden', view === 'monthly');
  document.querySelector('.week-nav').classList.toggle('schedule--hidden', view === 'monthly');
  document.getElementById('schedule-monthly-print').classList.toggle('schedule--hidden', view === 'weekly');
}

document.getElementById('view-weekly-btn').addEventListener('click', () => switchView('weekly'));
document.getElementById('view-monthly-btn').addEventListener('click', () => switchView('monthly'));

// ── Print ───────────────────────────────────────────────────────────────────

document.getElementById('print-btn').addEventListener('click', () => window.print());

// ── Init ────────────────────────────────────────────────────────────────────

(function init() {
  const hash = window.location.hash.slice(1);
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(hash)
    ? new Date(hash + 'T00:00:00')
    : JUNE_START;

  currentWeekStart = clampToJune(getWeekStart(startDate));
  update();

  document.getElementById('prev-week').addEventListener('click', () => navigate(-1));
  document.getElementById('next-week').addEventListener('click', () => navigate(1));
})();
