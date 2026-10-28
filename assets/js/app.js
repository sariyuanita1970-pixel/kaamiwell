/* =========================================================
   KAARNI STUDIO
   Programs, calendar, and booking desk
   ========================================================= */
(function () {
  'use strict';

  const MENUS = [
    {
      id: 'swedish',
      kanji: '01',
      name: 'Long-stroke Swedish',
      en: 'Flow',
      accent: '#2f4f3e',
      minutes: 60,
      price: 6800,
      desc: 'Slow, continuous strokes that wake circulation at the surface. The gentlest protocol we run, and the one we suggest if this is your first hour.',
      tags: ['First session', 'Full body', 'Light pressure']
    },
    {
      id: 'turkish',
      kanji: '02',
      name: 'Finnish heat ritual',
      en: 'Löyly',
      accent: '#b07a3a',
      minutes: 90,
      price: 11000,
      desc: 'Steamed towels and foam in a bathroom sequence. Warmth, friction, rest — ninety minutes built for a home tub or shower stall.',
      tags: ['Bathroom', 'Heat', 'Towel work']
    },
    {
      id: 'deep',
      kanji: '03',
      name: 'Fascia depth',
      en: 'Release',
      accent: '#c45b32',
      minutes: 75,
      price: 9200,
      desc: 'Inner shoulder blade, low back, the layers a palm usually misses. We teach how to lean body weight so the work goes in without strain.',
      tags: ['Firm', 'Shoulders & back', 'Knot work']
    },
    {
      id: 'shiatsu',
      kanji: '04',
      name: 'Line work',
      en: 'Meridian',
      accent: '#5a7d4a',
      minutes: 60,
      price: 7400,
      desc: 'Three-second holds along familiar lines, then a release. Thumbs only — no tools — paced with the breath.',
      tags: ['No kit', 'Lines', 'Breath-led']
    },
    {
      id: 'aroma',
      kanji: '05',
      name: 'Nordic botanicals',
      en: 'Oil',
      accent: '#6a5a8a',
      minutes: 80,
      price: 9800,
      desc: 'Palm work with forest oils. Birch, spruce, or bitter orange — we choose one for the day and the body in front of the camera.',
      tags: ['Forest oils', 'Nervous system', 'Evening']
    },
    {
      id: 'stone',
      kanji: '06',
      name: 'Basalt warmth',
      en: 'Stone',
      accent: '#3d5c68',
      minutes: 90,
      price: 12600,
      desc: 'Warmed basalt along the spine to loosen from the inside. For cold hands, seasonal heaviness. Stones ship ahead of the hour.',
      tags: ['Cold-prone', 'Heat', 'Kit shipped']
    }
  ];

  const OPTIONS = [
    { id: 'extend', label: 'Extra fifteen minutes', note: 'When the hour is not quite enough', price: 1500 },
    { id: 'kit',    label: 'Botanical kit', note: 'Oils or basalt, shipped three days ahead', price: 2200 },
    { id: 'pair',   label: 'Pair session', note: 'Trade the work with someone at home', price: 3000 }
  ];

  const THERAPISTS = [
    {
      id: 'yoshino', initial: 'ES', name: 'Elin Saarinen', role: 'SENIOR PRACTITIONER',
      bio: 'Eighteen years on the floor. Swedish flow and fascia are her main languages; she wrote the studio’s core sequences.',
      skills: ['Long-stroke Swedish', 'Fascia depth', 'Line work']
    },
    {
      id: 'kurata', initial: 'MK', name: 'Mikael Korhonen', role: 'HEAT SPECIALIST',
      bio: 'Three winters in Helsinki sauna culture. He adapted heat and foam work for ordinary bathrooms.',
      skills: ['Finnish heat ritual', 'Basalt warmth']
    },
    {
      id: 'asami', initial: 'AB', name: 'Aino Berg', role: 'BOTANICALS & PRENATAL',
      bio: 'Also blends the studio oils. Holds most of the late evening book, including prenatal hours.',
      skills: ['Nordic botanicals', 'Prenatal', 'Line work']
    }
  ];

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const CLOSED_WEEKDAY = 1;
  const BOOKING_WINDOW_DAYS = 60;
  const SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const yen = n => '€' + n.toLocaleString('en-US');

  const state = {
    step: 1,
    menuId: null,
    options: [],
    therapist: 'Any available',
    date: null,
    time: null,
    guest: {}
  };

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const keyOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function seededRandom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 1000) / 1000;
  }

  function isClosed(date) {
    return date.getDay() === CLOSED_WEEKDAY;
  }

  function slotsFor(date) {
    if (isClosed(date)) return [];
    const now = new Date();
    const limit = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return SLOT_HOURS.map(h => {
      const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0, 0);
      const r = seededRandom(keyOf(date) + ':' + h);
      const taken = r < 0.34;
      return {
        time: `${String(h).padStart(2, '0')}:00`,
        open: !taken && at > limit,
        past: at <= limit
      };
    });
  }

  function availabilityOf(date) {
    const today = startOfDay(new Date());
    const max = new Date(today); max.setDate(max.getDate() + BOOKING_WINDOW_DAYS);
    if (date < today || date > max || isClosed(date)) return { level: 'closed', count: 0 };
    const open = slotsFor(date).filter(s => s.open).length;
    if (open === 0) return { level: 'closed', count: 0 };
    if (open <= 3) return { level: 'few', count: open };
    return { level: 'open', count: open };
  }

  const currentMenu = () => MENUS.find(m => m.id === state.menuId) || null;

  function total() {
    const m = currentMenu();
    let sum = m ? m.price : 0;
    state.options.forEach(id => {
      const o = OPTIONS.find(x => x.id === id);
      if (o) sum += o.price;
    });
    return sum;
  }

  function durationLabel() {
    const m = currentMenu();
    if (!m) return '—';
    const extra = state.options.includes('extend') ? 15 : 0;
    return `${m.minutes + extra} min`;
  }

  function whenLabel() {
    if (!state.date || !state.time) return 'None yet';
    const d = state.date;
    return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })} · ${state.time}`;
  }

  function renderMenus() {
    const grid = $('#menuGrid');
    if (!grid) return;
    grid.innerHTML = MENUS.map(m => `
      <article class="menu-card reveal" style="--card-accent:${m.accent}">
        <div class="menu-card-top">
          <div>
            <h3>${m.name}</h3>
            <p class="menu-en">${m.en}</p>
          </div>
          <p class="menu-kanji" aria-hidden="true">${m.kanji}</p>
        </div>
        <p class="menu-desc">${m.desc}</p>
        <ul class="menu-tags">${m.tags.map(t => `<li>${t}</li>`).join('')}</ul>
        <div class="menu-meta">
          <span class="menu-time">${m.minutes} min · remote</span>
          <span class="menu-price">${yen(m.price)}<small>inc. tax</small></span>
        </div>
        <button class="menu-pick" type="button" data-pick="${m.id}">Book this protocol</button>
      </article>
    `).join('');

    $$('[data-pick]', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        selectMenu(btn.dataset.pick);
        goStep(1);
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderTherapists() {
    const grid = $('#therapistGrid');
    if (!grid) return;
    grid.innerHTML = THERAPISTS.map(t => `
      <article class="therapist-card reveal">
        <div class="therapist-face" aria-hidden="true">${t.initial}</div>
        <h3>${t.name}</h3>
        <p class="therapist-role">${t.role}</p>
        <p class="therapist-bio">${t.bio}</p>
        <ul class="therapist-skills">${t.skills.map(s => `<li>${s}</li>`).join('')}</ul>
      </article>
    `).join('');

    const sel = $('#therapistSelect');
    if (sel) {
      THERAPISTS.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = `${t.name} (${t.skills[0]})`;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => { state.therapist = sel.value; });
    }
  }

  function renderChoices() {
    const box = $('#planChoices');
    if (!box) return;
    box.innerHTML = MENUS.map(m => `
      <label class="choice">
        <input type="radio" name="plan" value="${m.id}">
        <span class="choice-inner">
          <span class="choice-name">${m.name}</span>
          <span class="choice-en">${m.en}</span>
          <span class="choice-meta"><span>${m.minutes} min</span><b>${yen(m.price)}</b></span>
        </span>
      </label>
    `).join('');

    $$('input[name="plan"]', box).forEach(input => {
      input.addEventListener('change', () => selectMenu(input.value));
    });

    const list = $('#optionList');
    if (list) {
      list.innerHTML = OPTIONS.map(o => `
        <label class="option">
          <input type="checkbox" value="${o.id}">
          <span class="option-text">${o.label}<small>${o.note}</small></span>
          <span class="option-price">+${yen(o.price)}</span>
        </label>
      `).join('');

      $$('input[type="checkbox"]', list).forEach(cb => {
        cb.addEventListener('change', () => {
          state.options = $$('#optionList input:checked').map(x => x.value);
          updateSummary();
        });
      });
    }
  }

  function selectMenu(id) {
    state.menuId = id;
    const input = $(`#planChoices input[value="${id}"]`);
    if (input) input.checked = true;
    setHint('#hint1', '');
    updateSummary();
    if (state.date) renderSlots();
  }

  let viewMonth = startOfDay(new Date());
  viewMonth.setDate(1);

  function renderCalendar() {
    const grid = $('#calGrid');
    const label = $('#calMonth');
    if (!grid || !label) return;

    label.textContent = viewMonth.toLocaleString('en', { month: 'long', year: 'numeric' });

    const today = startOfDay(new Date());
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const lead = first.getDay();

    let html = '';
    for (let i = 0; i < lead; i++) html += '<span class="cal-day is-empty"></span>';

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      const av = availabilityOf(date);
      const disabled = av.level === 'closed';
      const isToday = date.getTime() === today.getTime();
      const selected = state.date && date.getTime() === state.date.getTime();
      const title = disabled
        ? (isClosed(date) ? 'Studio closed' : 'Full / outside window')
        : `${av.count} slots left`;

      html += `<button type="button" class="cal-day${selected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}"
        data-date="${keyOf(date)}" ${disabled ? 'disabled' : ''} title="${title}" aria-label="${date.toDateString()} ${title}">
        <span>${d}</span><i class="dot dot-${av.level}"></i>
      </button>`;
    }

    grid.innerHTML = html;

    $$('.cal-day[data-date]', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        const [y, m, d] = btn.dataset.date.split('-').map(Number);
        state.date = new Date(y, m - 1, d);
        state.time = null;
        renderCalendar();
        renderSlots();
        updateSummary();
      });
    });

    const prev = $('#calPrev');
    const next = $('#calNext');
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + BOOKING_WINDOW_DAYS);
    const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    if (prev) prev.disabled = viewMonth <= thisMonth;
    if (next) next.disabled = viewMonth >= maxMonth;
  }

  function renderSlots() {
    const box = $('#slotGrid');
    const title = $('#slotsTitle');
    if (!box || !title) return;

    if (!state.date) {
      title.textContent = 'Pick a date first';
      box.innerHTML = '<p class="slots-empty">Use the calendar to choose a day.</p>';
      return;
    }

    const d = state.date;
    title.textContent = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`;

    const slots = slotsFor(d);
    if (!slots.length) {
      box.innerHTML = '<p class="slots-empty">The studio is closed this day.</p>';
      return;
    }
    if (!slots.some(s => s.open)) {
      box.innerHTML = '<p class="slots-empty">This day is full. Try another date.</p>';
      return;
    }

    const m = currentMenu();
    box.innerHTML = slots.map(s => `
      <button type="button" class="slot${state.time === s.time ? ' is-selected' : ''}"
        data-time="${s.time}" ${s.open ? '' : 'disabled'}>
        ${s.time}
        <small>${s.open ? (m ? durationLabel() : 'Open') : (s.past ? 'Closed' : 'Full')}</small>
      </button>
    `).join('');

    $$('.slot[data-time]', box).forEach(btn => {
      btn.addEventListener('click', () => {
        state.time = btn.dataset.time;
        renderSlots();
        updateSummary();
        setHint('#hint2', '');
      });
    });
  }

  function goStep(n) {
    state.step = n;
    $$('.panel').forEach(p => p.classList.toggle('is-active', Number(p.dataset.panel) === n));
    $$('.step').forEach(s => {
      const idx = Number(s.dataset.step);
      s.classList.toggle('is-active', idx === n);
      s.classList.toggle('is-done', idx < n);
    });
    if (n === 2) { renderCalendar(); renderSlots(); }
    if (n === 4) renderConfirm();

    const shell = $('.booking-shell');
    if (shell && window.scrollY > shell.offsetTop) {
      shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function setHint(sel, msg) {
    const el = $(sel);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.add('is-warn');
    } else {
      el.classList.remove('is-warn');
      el.textContent = el.dataset.base || el.textContent;
    }
  }

  function validateStep(n) {
    if (n === 1) {
      if (!state.menuId) { setHint('#hint1', 'Please choose a protocol.'); return false; }
      return true;
    }
    if (n === 2) {
      if (!state.date || !state.time) { setHint('#hint2', 'Please choose both a date and a time.'); return false; }
      return true;
    }
    if (n === 3) return validateGuest();
    return true;
  }

  function showError(id, msg) {
    const field = $(`#${id}`);
    const slot = $(`[data-error-for="${id}"]`);
    if (slot) slot.textContent = msg || '';
    if (field) {
      const wrap = field.closest('.field');
      if (wrap) wrap.classList.toggle('has-error', Boolean(msg));
    }
  }

  function validateGuest() {
    let ok = true;

    const name = $('#name').value.trim();
    if (!name) { showError('name', 'Please enter your name.'); ok = false; }
    else { showError('name', ''); }

    const email = $('#email').value.trim();
    if (!email) { showError('email', 'Please enter an email address.'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('email', 'Check the email format.'); ok = false; }
    else { showError('email', ''); }

    const tel = $('#tel').value.trim();
    if (!tel) { showError('tel', 'Please enter a phone number.'); ok = false; }
    else if (!/^[0-9０-９+\-（）() ]{9,20}$/.test(tel)) { showError('tel', 'Use digits, spaces, or hyphens.'); ok = false; }
    else { showError('tel', ''); }

    const agree = $('#agree').checked;
    const agreeSlot = $('[data-error-for="agree"]');
    if (!agree) {
      if (agreeSlot) agreeSlot.textContent = 'Please agree to the studio terms.';
      ok = false;
    } else if (agreeSlot) {
      agreeSlot.textContent = '';
    }

    if (ok) {
      state.guest = {
        name,
        kana: $('#kana').value.trim(),
        email,
        tel,
        note: $('#note').value.trim()
      };
      setHint('#hint3', '');
    } else {
      setHint('#hint3', 'Please check the marked fields.');
    }
    return ok;
  }

  function renderConfirm() {
    const m = currentMenu();
    const list = $('#confirmList');
    if (!m || !list) return;

    const opts = state.options.map(id => {
      const o = OPTIONS.find(x => x.id === id);
      return o ? `${o.label} (+${yen(o.price)})` : '';
    }).filter(Boolean);

    const rows = [
      ['Protocol', `${m.name} <small>${m.en}</small>`],
      ['When', `${whenLabel()} / ${durationLabel()}`],
      ['Practitioner', state.therapist],
      ['Add-ons', opts.length ? opts.join('<br>') : 'None'],
      ['Name', `${state.guest.name}${state.guest.kana ? ` (${state.guest.kana})` : ''}`],
      ['Contact', `${state.guest.email}<br>${state.guest.tel}`],
      ['Notes', state.guest.note ? state.guest.note.replace(/\n/g, '<br>') : 'None']
    ];

    list.innerHTML = rows.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('');
    $('#confirmTotal').textContent = yen(total());
  }

  function reservationNumber(date) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `KRN-${keyOf(date).replace(/-/g, '')}-${rand}`;
  }

  function submitBooking(e) {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    const num = reservationNumber(state.date);
    const record = {
      number: num,
      menu: currentMenu().name,
      when: whenLabel(),
      duration: durationLabel(),
      therapist: state.therapist,
      options: state.options.slice(),
      total: total(),
      guest: Object.assign({}, state.guest),
      createdAt: new Date().toISOString()
    };

    try {
      const all = JSON.parse(localStorage.getItem('kaarni.bookings') || '[]');
      all.push(record);
      localStorage.setItem('kaarni.bookings', JSON.stringify(all));
    } catch (err) {
      /* display still proceeds */
    }

    $('#doneList').innerHTML = [
      ['Booking no.', num],
      ['Protocol', record.menu],
      ['When', record.when],
      ['Practitioner', record.therapist],
      ['Due', yen(record.total) + ' (after session)']
    ].map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('');

    $('#bookingForm').hidden = true;
    $('#stepper').hidden = true;
    $('#summaryBar').hidden = true;
    $('#donePanel').hidden = false;
    $('.booking-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetBooking() {
    state.menuId = null;
    state.options = [];
    state.therapist = 'Any available';
    state.date = null;
    state.time = null;
    state.guest = {};

    $('#bookingForm').reset();
    $('#bookingForm').hidden = false;
    $('#stepper').hidden = false;
    $('#summaryBar').hidden = false;
    $('#donePanel').hidden = true;
    ['name', 'email', 'tel'].forEach(id => showError(id, ''));
    const agreeSlot = $('[data-error-for="agree"]');
    if (agreeSlot) agreeSlot.textContent = '';

    renderCalendar();
    renderSlots();
    updateSummary();
    goStep(1);
  }

  function updateSummary() {
    const m = currentMenu();
    $('#summaryPlan').textContent = m ? `${m.name} · ${durationLabel()}` : 'None yet';
    $('#summaryWhen').textContent = whenLabel();
    $('#summaryTotal').textContent = yen(total());
  }

  function initHeader() {
    const header = $('#siteHeader');
    const toggle = $('#navToggle');
    const nav = $('#nav');

    window.addEventListener('scroll', () => {
      header.classList.toggle('is-stuck', window.scrollY > 10);
    }, { passive: true });

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      $$('a', nav).forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }
  }

  function initTheme() {
    const btn = $('#themeToggle');
    if (!btn) return;

    const icon = $('.theme-toggle-icon', btn);
    const label = $('.theme-toggle-label', btn);
    const saved = (() => { try { return localStorage.getItem('kaarni.theme'); } catch (e) { return null; } })();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let dark = saved ? saved === 'dark' : prefersDark;

    function apply() {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      btn.setAttribute('aria-pressed', String(dark));
      icon.textContent = dark ? '☀' : '☾';
      label.textContent = dark ? 'Dawn' : 'Dusk';
    }
    apply();

    btn.addEventListener('click', () => {
      dark = !dark;
      try { localStorage.setItem('kaarni.theme', dark ? 'dark' : 'light'); } catch (e) {}
      apply();
    });
  }

  function initReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('is-in'), i * 70);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    items.forEach(el => io.observe(el));
  }

  function initTodayCard() {
    const d = new Date();
    const label = $('#todayLabel');
    const slots = $('#todaySlots');
    if (label) label.textContent = d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (slots) {
      const av = availabilityOf(startOfDay(d));
      slots.textContent = av.level === 'closed'
        ? (isClosed(d) ? 'Closed today' : 'Full today')
        : `${av.count} remaining`;
    }
  }

  function init() {
    renderMenus();
    renderTherapists();
    renderChoices();
    renderCalendar();
    renderSlots();
    updateSummary();
    initHeader();
    initTheme();
    initTodayCard();
    initReveal();

    $$('.panel-hint').forEach(el => { el.dataset.base = el.textContent; });

    $$('[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        const to = Number(btn.dataset.next);
        if (validateStep(to - 1)) goStep(to);
      });
    });
    $$('[data-prev]').forEach(btn => {
      btn.addEventListener('click', () => goStep(Number(btn.dataset.prev)));
    });
    $$('.step').forEach(s => {
      s.addEventListener('click', () => {
        const to = Number(s.dataset.step);
        if (to < state.step) goStep(to);
      });
    });

    $('#calPrev').addEventListener('click', () => {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    $('#calNext').addEventListener('click', () => {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    $('#bookingForm').addEventListener('submit', submitBooking);
    $('#resetBooking').addEventListener('click', resetBooking);

    ['name', 'email', 'tel'].forEach(id => {
      const el = $(`#${id}`);
      if (el) el.addEventListener('blur', () => { if (el.value.trim()) validateGuest(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
