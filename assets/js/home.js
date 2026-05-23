// Data injected by Jekyll — see index.html script block
// INSTRUCTORS_ARR, RECURRING, WORKSHOPS

const INSTRUCTORS = {};
INSTRUCTORS_ARR.forEach(i => (INSTRUCTORS[i.id] = i));

const DAY_TO_JS = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6
};

// ── Date utilities ──────────────────────────────────────────────────────────

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

function formatDayLabel(date, todayYMD) {
  const ymd = toYMD(date);
  const weekday = date.toLocaleString('en-US', { weekday: 'short' });
  const month   = date.toLocaleString('en-US', { month: 'short' });
  const day     = date.getDate();

  if (ymd === todayYMD)                          return `Today · ${weekday} ${month} ${day}`;
  if (ymd === toYMD(addDays(new Date(todayYMD + 'T00:00:00'), 1)))
                                                  return `Tomorrow · ${weekday} ${month} ${day}`;
  return `${weekday} ${month} ${day}`;
}

// ── Data ────────────────────────────────────────────────────────────────────

function getUpcomingEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayYMD = toYMD(today);
  const events = [];

  for (let i = 0; i < 7; i++) {
    const date  = addDays(today, i);
    const ymd   = toYMD(date);
    const ym    = toYM(date);
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
        type: 'workshop',
      });
    });
  }

  events.sort((a, b) =>
    a.ymd !== b.ymd
      ? a.ymd.localeCompare(b.ymd)
      : parseTime(a.time).sort - parseTime(b.time).sort
  );

  return { events, todayYMD };
}

// ── Render ──────────────────────────────────────────────────────────────────

(function render() {
  const output = document.getElementById('upcoming-output');
  const { events, todayYMD } = getUpcomingEvents();

  if (!events.length) {
    output.innerHTML = '<p class="upcoming__empty">Check back soon for the latest schedule.</p>';
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

  output.innerHTML = days.map(({ date, events: es }) => {
    const badge = type => type === 'workshop'
      ? '<span class="event__badge">workshop</span> ' : '';

    const items = es.map(e => `
      <li class="event">
        <span class="event__time">${formatTime(e.time)}</span>
        <div class="event__body">
          <span class="event__name">${badge(e.type)}${e.title}</span>
          <span class="event__with">${e.instructor}</span>
        </div>
      </li>`).join('');

    return `
      <div class="schedule__day-group">
        <h3 class="schedule__day">${formatDayLabel(date, todayYMD)}</h3>
        <ul class="events">${items}</ul>
      </div>`;
  }).join('');
})();
