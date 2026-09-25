/* Designentwurf „Farbfabrik Paintball – Paintpark Wesenberg“
   Gestaltung und Code © 2026 Mykhailo Sibahatov. Alle Rechte vorbehalten.
   Nur zur Ansicht — keine Nutzung ohne schriftliche Vereinbarung (LICENSE).
   Farbfabrik Paintball – Paintpark Wesenberg — interactions. No dependencies. */
(function () {
  'use strict';

  /* ---------- Licence: the draft only runs where it has been licensed ----------
     Add a domain here once a written agreement is in place. */
  var LICENSED = ['sibagatovmihail.github.io', 'localhost', '127.0.0.1'];
  if (location.protocol !== 'file:' && LICENSED.indexOf(location.hostname) === -1) {
    var lock = document.createElement('div');
    lock.className = 'licence-lock';
    lock.setAttribute('role', 'alertdialog');
    lock.innerHTML = '<div><b>Nicht lizenzierte Kopie</b>' +
      '<p>Diese Website ist ein urheberrechtlich geschützter Designentwurf von Mykhailo Sibahatov und für diese Domain nicht lizenziert.</p>' +
      '<p>Nutzungsrechte: <a href="mailto:sibagatovmihail@gmail.com">sibagatovmihail@gmail.com</a></p></div>';
    document.body.appendChild(lock);
    document.documentElement.style.overflow = 'hidden';
  }

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 37.5rem)');

  /* ---------- frozen viewport unit: refresh on width change only ----------
     iOS Safari changes innerHeight while the URL bar collapses; a vh that
     follows it would make the hero and the open sheet jump. */
  var vhPx = window.innerHeight;
  var vw0 = window.innerWidth;
  root.style.setProperty('--vh', (vhPx * 0.01) + 'px');
  window.addEventListener('resize', function () {
    if (window.innerWidth !== vw0) {
      vw0 = window.innerWidth;
      vhPx = window.innerHeight;
      root.style.setProperty('--vh', (vhPx * 0.01) + 'px');
    }
  });

  /* ---------- scroll lock for the menu sheet and the calendar sheet ----------
     overflow:hidden alone does not stop iOS Safari, so the body is pinned at
     the current offset and the exact position is restored on close. */
  var lockY = 0, locks = 0;
  function lockScroll(on) {
    var b = document.body.style;
    if (on) {
      if (locks++ > 0) return;
      lockY = window.scrollY;
      b.position = 'fixed'; b.top = -lockY + 'px'; b.left = '0'; b.right = '0'; b.width = '100%';
    } else {
      if (locks === 0 || --locks > 0) return;
      b.position = b.top = b.left = b.right = b.width = '';
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, lockY);
      root.style.scrollBehavior = '';
    }
  }

  /* ---------- preloader: the logo lands like a paint hit (once per visit) ---------- */
  var pre = document.querySelector('.preloader');
  var seen = false;
  try { seen = sessionStorage.getItem('fw-intro') === '1'; sessionStorage.setItem('fw-intro', '1'); } catch (e) {}
  function pageReady() {
    requestAnimationFrame(function () { setTimeout(function () { root.classList.add('is-loaded'); firstHits(); }, 80); });
  }
  if (!pre || reduceMotion || seen) {
    if (pre) pre.classList.add('is-gone');
    pageReady();
  } else {
    setTimeout(function () {
      pre.classList.add('is-leaving');
      pageReady();
      setTimeout(function () { pre.classList.add('is-gone'); }, 500);
    }, 1350);
  }

  /* ---------- header: state on scroll + current section ---------- */
  var header = document.querySelector('.site-header');
  var ticking = false;
  function onScroll() {
    ticking = false;
    if (root.classList.contains('nav-open')) return;          /* body is pinned; keep the state it had */
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    markCurrent();
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- navigation: the strip grows into the sheet on phones ---------- */
  var strip = document.querySelector('.navbar');
  var toggle = document.querySelector('.navbar__toggle');
  function setNav(open) {
    if ((strip.getAttribute('data-open') === 'true') === open) return;
    strip.setAttribute('data-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.visually-hidden').textContent = open ? 'Menü schließen' : 'Menü öffnen';
    if (open) lockScroll(true);
    root.classList.toggle('nav-open', open);
    if (!open) lockScroll(false);
  }
  toggle.addEventListener('click', function () { setNav(strip.getAttribute('data-open') !== 'true'); });
  /* anchor links in the sheet: unlock first, then let the jump happen */
  strip.querySelector('.navbar__menu').addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || strip.getAttribute('data-open') !== 'true') return;
    var hash = a.getAttribute('href');
    if (hash.charAt(0) !== '#') { setNav(false); return; }
    e.preventDefault();
    setNav(false);
    var target = document.querySelector(hash);
    if (target) {
      requestAnimationFrame(function () { target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); });
      history.replaceState(null, '', hash);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && strip.getAttribute('data-open') === 'true') { setNav(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (strip.getAttribute('data-open') === 'true' && !e.target.closest('.navbar')) setNav(false);
  });
  window.matchMedia('(min-width: 64.0625rem)').addEventListener('change', function (m) { if (m.matches) setNav(false); });

  /* ---------- header hover: one tinted block glides from link to link ---------- */
  var menu = document.querySelector('.navbar__menu');
  var wideHover = window.matchMedia('(min-width: 64.0625rem) and (hover: hover) and (pointer: fine)');
  if (!reduceMotion) {
    var links = menu.querySelector('.navbar__links');
    var glider = document.createElement('span');
    glider.className = 'navbar__glider';
    glider.setAttribute('aria-hidden', 'true');
    links.prepend(glider);
    var moveTo = function (link) {
      glider.style.left = link.offsetLeft + 'px';
      glider.style.top = link.offsetTop + 'px';
      glider.style.width = link.offsetWidth + 'px';
    };
    var showGlider = function (link) {
      if (!wideHover.matches) return;
      if (!menu.classList.contains('has-glider')) {
        glider.style.transition = 'none';
        moveTo(link);
        void glider.offsetWidth;
        glider.style.transition = '';
        menu.classList.add('has-glider');
      } else {
        moveTo(link);
      }
    };
    var hideGlider = function () { menu.classList.remove('has-glider'); };
    links.querySelectorAll('.navbar__link').forEach(function (link) {
      link.addEventListener('mouseenter', function () { showGlider(link); });
      link.addEventListener('focus', function () { showGlider(link); });
      link.addEventListener('blur', hideGlider);
    });
    links.addEventListener('mouseleave', hideGlider);
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.navbar__link'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var kontakt = document.getElementById('kontakt');
  function markCurrent() {
    var line = window.innerHeight * 0.35, current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) current = i; });
    if (kontakt && kontakt.getBoundingClientRect().top <= line) current = -1;
    navLinks.forEach(function (a, i) {
      a.classList.toggle('is-current', i === current);
      if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  onScroll();

  /* ---------- hero: click the field, leave a paint hit ---------- */
  var hero = document.querySelector('.hero');
  var hits = hero.querySelector('.hero__hits');
  var paints = ['--pink', '--yellow', '--blue', '--green', '--orange', '--violet'];
  var hitN = 0;
  function splat(x, y, remSize, color) {
    var rem = parseFloat(getComputedStyle(root).fontSize) || 16;
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('class', 'hit');
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--s', (remSize * rem) + 'px');
    el.style.setProperty('--r', Math.round(Math.random() * 360) + 'deg');
    el.style.setProperty('--c', 'var(' + (color || paints[hitN % paints.length]) + ')');
    el.innerHTML = '<use href="#splat-' + (1 + Math.floor(Math.random() * 4)) + '"/>';
    hits.appendChild(el);
    hitN++;
    var all = hits.querySelectorAll('.hit:not(.is-fading)');
    if (all.length > 14) {
      var old = all[0];
      old.classList.add('is-fading');
      setTimeout(function () { old.remove(); }, 1300);
    }
  }
  function firstHits() {
    if (reduceMotion) return;
    var w = hero.clientWidth, h = hero.clientHeight;
    var wide = w > 768;
    var spots = wide
      ? [[.93, .2, 9, '--pink'], [.68, .93, 6, '--yellow'], [.97, .78, 7, '--blue']]
      : [[.97, .13, 6.5, '--pink'], [.93, .985, 5.5, '--blue']];
    spots.forEach(function (s, i) {
      setTimeout(function () { splat(s[0] * w, s[1] * h, s[2], s[3]); }, 250 + i * 160);
    });
  }
  hero.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.target.closest('a, button, input')) return;
    var r = hero.getBoundingClientRect();
    splat(e.clientX - r.left, e.clientY - r.top, 4 + Math.random() * 4);
  });

  /* ---------- reveal: whole groups, never per item ---------- */
  var reveals = document.querySelectorAll('.reveal');
  function finish(el) {
    el.classList.add('is-in');
    var done = function () { el.classList.add('is-done'); };
    el.addEventListener('transitionend', function (e) { if (e.target === el) done(); });
    setTimeout(done, 1000);
  }
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in', 'is-done'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { finish(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
    var sweeping = false;
    var sweep = function () {
      sweeping = false;
      reveals.forEach(function (el) {
        if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < vhPx) { finish(el); io.unobserve(el); }
      });
    };
    window.addEventListener('scroll', function () {
      if (!sweeping) { sweeping = true; requestAnimationFrame(sweep); }
    }, { passive: true });
    window.addEventListener('load', sweep);
  }

  /* ---------- price tabs (Erwachsene / Kids) with a sliding block ---------- */
  var tablist = document.querySelector('.tabs');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var ink = tablist.querySelector('.tabs__ink');
    var placeInk = function (instant) {
      var t = tablist.querySelector('[aria-selected="true"]');
      if (instant) tablist.classList.add('no-ink');
      ink.style.left = t.offsetLeft + 'px';
      ink.style.width = t.offsetWidth + 'px';
      if (instant) { void ink.offsetWidth; tablist.classList.remove('no-ink'); }
    };
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      placeInk(false);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
        else if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        else if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
    placeInk(true);
    window.addEventListener('resize', function () { placeInk(true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeInk(true); });
  }

  /* ---------- steppers: − value + ---------- */
  document.querySelectorAll('.stepper').forEach(function (st) {
    var input = st.querySelector('.stepper__input');
    var min = +st.getAttribute('data-min') || 1, max = +st.getAttribute('data-max') || 99;
    var btns = st.querySelectorAll('.stepper__btn');
    var set = function (v, silent) {
      v = Math.max(min, Math.min(max, Math.round(v) || min));
      input.value = v;
      btns[0].disabled = v <= min;
      btns[1].disabled = v >= max;
      if (!silent) input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () { set((+input.value || 0) + (+b.getAttribute('data-step'))); });
    });
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 3);
      if (input.value !== '') input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    input.addEventListener('blur', function () { set(+input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') { e.preventDefault(); set((+input.value || 0) + 1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); set((+input.value || 0) - 1); }
    });
    st._set = set;
    set(+input.value, true);
  });

  /* ---------- segmented choice (a custom radio group) ---------- */
  document.querySelectorAll('.seg').forEach(function (seg) {
    var opts = Array.prototype.slice.call(seg.querySelectorAll('[role="radio"]'));
    var pick = function (o, focus) {
      opts.forEach(function (x) { var on = x === o; x.setAttribute('aria-checked', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
      if (focus) o.focus();
      seg.dispatchEvent(new Event('change', { bubbles: true }));
    };
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { pick(o, false); });
      o.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); pick(opts[(i + k + opts.length) % opts.length], true); }
      });
    });
  });

  /* ---------- group calculator ---------- */
  var calc = document.querySelector('.calc');
  var PRICES = { klein: [45, 40, 35], gross: [55, 50, 45] };
  var BALLS = { klein: 500, gross: 1000 };
  var PAKET = { klein: 'Kleines Paket (45 €)', gross: 'Großes Paket (55 €)' };
  var fmt = function (n) { return n.toLocaleString('de-DE'); };
  function calcState() {
    var n = Math.max(1, +calc.querySelector('#calc-n').value || 1);
    var pkg = calc.querySelector('.seg [aria-checked="true"]').getAttribute('data-value');
    return { n: n, pkg: pkg };
  }
  function runCalc() {
    var s = calcState(), t = PRICES[s.pkg];
    var pp = s.n >= 20 ? t[2] : s.n >= 10 ? t[1] : t[0];
    calc.querySelector('[data-out="pp"]').textContent = pp;
    calc.querySelector('[data-out="total"]').textContent = fmt(pp * s.n) + ' €';
    calc.querySelector('[data-out="balls"]').textContent = fmt(BALLS[s.pkg] * s.n);
    var miss, hint;
    if (s.n < 10) { miss = 10 - s.n; hint = 'Noch ' + miss + (miss === 1 ? ' Person' : ' Personen') + ', dann gilt der Gruppenpreis von ' + t[1] + ' €.'; }
    else if (s.n < 20) { miss = 20 - s.n; hint = 'Noch ' + miss + (miss === 1 ? ' Person' : ' Personen') + ' bis ' + t[2] + ' € pro Person.'; }
    else hint = 'Bester Gruppenpreis erreicht.';
    calc.querySelector('[data-out="hint"]').textContent = hint;
  }
  if (calc) {
    calc.addEventListener('change', runCalc);
    runCalc();
  }

  /* ---------- custom dropdowns — the native <select> stays for the value ---------- */
  document.querySelectorAll('#anfrage select.input').forEach(function (sel) {
    var wrap = document.createElement('div');
    wrap.className = 'select';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('select__native');
    sel.classList.remove('input');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    var id = sel.id;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'input select__btn';
    btn.id = id + '-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="select__val"></span><svg class="select__chev" aria-hidden="true"><use href="#i-chev"/></svg>';
    var label = document.querySelector('label[for="' + id + '"]');
    if (label) { label.htmlFor = btn.id; label.id = id + '-lbl'; btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id); }

    var list = document.createElement('ul');
    list.className = 'select__list';
    list.id = id + '-list';
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;
    if (label) list.setAttribute('aria-labelledby', label.id);
    btn.setAttribute('aria-controls', list.id);
    var opts = Array.prototype.map.call(sel.options, function (o, i) {
      var li = document.createElement('li');
      li.id = id + '-o' + i;
      li.setAttribute('role', 'option');
      li.innerHTML = '<span></span><svg aria-hidden="true"><use href="#i-check"/></svg>';
      li.firstChild.textContent = o.text;
      if (o.value === '') li.classList.add('is-placeholder');
      list.appendChild(li);
      return li;
    });
    wrap.appendChild(btn);
    wrap.appendChild(list);

    var active = sel.selectedIndex;
    var sync = function () {
      var o = sel.options[sel.selectedIndex];
      btn.querySelector('.select__val').textContent = o ? o.text : '';
      btn.classList.toggle('is-empty', !o || o.value === '');
      opts.forEach(function (li, i) { li.setAttribute('aria-selected', String(i === sel.selectedIndex)); });
    };
    var mark = function (i) {
      active = Math.max(0, Math.min(opts.length - 1, i));
      opts.forEach(function (li, k) { li.classList.toggle('is-active', k === active); });
      list.setAttribute('aria-activedescendant', opts[active].id);
      var li = opts[active];
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop - 4;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight + 4;
    };
    var open = function () {
      document.querySelectorAll('.select.is-open').forEach(function (w) { if (w !== wrap) w._close(); });
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      var r = btn.getBoundingClientRect();
      wrap.classList.toggle('is-up', window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom);
      mark(sel.selectedIndex < 0 ? 0 : sel.selectedIndex);
      list.focus({ preventScroll: true });
    };
    var close = function (focusBtn) {
      wrap.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus({ preventScroll: true });
    };
    wrap._close = function () { close(false); };
    var choose = function (i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    };
    btn.addEventListener('click', function () { wrap.classList.contains('is-open') ? close(true) : open(); });
    btn.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].indexOf(e.key) > -1) { e.preventDefault(); open(); }
    });
    var typed = '', typedT;
    list.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(active - 1); }
      else if (e.key === 'Home') { e.preventDefault(); mark(0); }
      else if (e.key === 'End') { e.preventDefault(); mark(opts.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') { close(false); }
      else if (e.key.length === 1) {                          /* type-ahead */
        typed += e.key.toLowerCase(); clearTimeout(typedT);
        typedT = setTimeout(function () { typed = ''; }, 600);
        for (var k = 0; k < opts.length; k++) {
          if (sel.options[k].text.toLowerCase().indexOf(typed) === 0) { mark(k); break; }
        }
      }
    });
    opts.forEach(function (li, i) {
      li.addEventListener('click', function () { choose(i); });
      li.addEventListener('mousemove', function () { if (active !== i) mark(i); });
    });
    sel.addEventListener('change', sync);
    sync();
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.select.is-open').forEach(function (w) { if (!w.contains(e.target)) w._close(); });
  });

  /* ---------- date picker: German calendar, Monday first, no past days ---------- */
  var dp = document.querySelector('.datepick');
  if (dp) {
    var dpBtn = dp.querySelector('.datepick__btn');
    var dpVal = dp.querySelector('.datepick__val');
    var dpInput = dp.querySelector('input[type="hidden"]');
    var cal = dp.querySelector('.cal');
    var calTitle = cal.querySelector('.cal__title');
    var calBody = cal.querySelector('tbody');
    var calPrev = cal.querySelector('[data-cal="-1"]');
    var calNext = cal.querySelector('[data-cal="1"]');
    var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    var DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var dayOnly = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
    var today = dayOnly(new Date());
    var maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    var chosen = null, focusD = today, viewY = today.getFullYear(), viewM = today.getMonth();
    var scrim = null;
    var same = function (a, b) { return a && b && a.getTime() === b.getTime(); };

    var render = function () {
      calTitle.textContent = MONTHS[viewM] + ' ' + viewY;
      calPrev.disabled = viewY === today.getFullYear() && viewM === today.getMonth();
      calNext.disabled = viewY === maxDate.getFullYear() && viewM === maxDate.getMonth();
      var first = new Date(viewY, viewM, 1);
      var lead = (first.getDay() + 6) % 7;
      var days = new Date(viewY, viewM + 1, 0).getDate();
      var html = '', cell = 0;
      for (var w = 0; w < 6 && cell < lead + days; w++) {
        html += '<tr>';
        for (var d = 0; d < 7; d++, cell++) {
          var n = cell - lead + 1;
          if (n < 1 || n > days) { html += '<td></td>'; continue; }
          var date = new Date(viewY, viewM, n);
          var off = date < today || date > maxDate;
          var cls = 'cal__day' + (d > 4 ? ' is-we' : '') + (same(date, today) ? ' is-today' : '');
          html += '<td><button type="button" class="' + cls + '" data-d="' + n + '"' +
            ' aria-label="' + DAYS[date.getDay()] + ', ' + n + '. ' + MONTHS[viewM] + ' ' + viewY + '"' +
            ' aria-selected="' + (same(date, chosen) ? 'true' : 'false') + '"' +
            ' tabindex="' + (same(date, focusD) ? '0' : '-1') + '"' + (off ? ' disabled' : '') + '>' + n + '</button></td>';
        }
        html += '</tr>';
      }
      calBody.innerHTML = html;
    };
    var focusDay = function () {
      var b = calBody.querySelector('[tabindex="0"]');
      if (b) b.focus({ preventScroll: true });
    };
    var moveFocus = function (d) {
      if (d < today) d = today;
      if (d > maxDate) d = maxDate;
      focusD = d; viewY = d.getFullYear(); viewM = d.getMonth();
      render(); focusDay();
    };
    var openCal = function () {
      focusD = chosen || today; viewY = focusD.getFullYear(); viewM = focusD.getMonth();
      render();
      cal.hidden = false;
      dpBtn.setAttribute('aria-expanded', 'true');
      if (phone.matches) {
        scrim = document.createElement('div');
        scrim.className = 'cal-scrim';
        scrim.addEventListener('click', function () { closeCal(true); });
        dp.appendChild(scrim);
        lockScroll(true);
      }
      focusDay();
    };
    var closeCal = function (focusBtn) {
      if (cal.hidden) return;
      cal.hidden = true;
      dpBtn.setAttribute('aria-expanded', 'false');
      if (scrim) { scrim.remove(); scrim = null; lockScroll(false); }
      if (focusBtn) dpBtn.focus({ preventScroll: true });
    };
    var pick = function (d) {
      chosen = d;
      dpInput.value = pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
      dpVal.textContent = DAYS[d.getDay()].slice(0, 2) + ', ' + dpInput.value;
      dpBtn.classList.remove('is-empty');
      closeCal(true);
    };
    dpBtn.addEventListener('click', function () { cal.hidden ? openCal() : closeCal(true); });
    calPrev.addEventListener('click', function () { viewM--; if (viewM < 0) { viewM = 11; viewY--; } render(); });
    calNext.addEventListener('click', function () { viewM++; if (viewM > 11) { viewM = 0; viewY++; } render(); });
    calBody.addEventListener('click', function (e) {
      var b = e.target.closest('.cal__day');
      if (b && !b.disabled) pick(new Date(viewY, viewM, +b.getAttribute('data-d')));
    });
    calBody.addEventListener('keydown', function (e) {
      var b = e.target.closest('.cal__day');
      if (!b) return;
      var cur = new Date(viewY, viewM, +b.getAttribute('data-d'));
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (step) { e.preventDefault(); moveFocus(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + step)); }
      else if (e.key === 'Home') { e.preventDefault(); moveFocus(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - (cur.getDay() + 6) % 7)); }
      else if (e.key === 'End') { e.preventDefault(); moveFocus(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 6 - (cur.getDay() + 6) % 7)); }
      else if (e.key === 'PageUp') { e.preventDefault(); moveFocus(new Date(cur.getFullYear(), cur.getMonth() - 1, Math.min(cur.getDate(), 28))); }
      else if (e.key === 'PageDown') { e.preventDefault(); moveFocus(new Date(cur.getFullYear(), cur.getMonth() + 1, Math.min(cur.getDate(), 28))); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!b.disabled) pick(cur); }
    });
    cal.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); closeCal(true); } });
    document.addEventListener('click', function (e) { if (!cal.hidden && !dp.contains(e.target)) closeCal(false); });
    phone.addEventListener('change', function () { closeCal(false); });
  }

  /* ---------- prefill: cards, packages and the calculator fill the form ---------- */
  var form = document.getElementById('anfrage');
  function setSelect(id, text) {
    var sel = document.getElementById(id);
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].text === text) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); return; }
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-anlass], [data-paket], [data-calc-send]');
    if (!a) return;
    if (a.hasAttribute('data-anlass')) setSelect('f-anlass', a.getAttribute('data-anlass'));
    if (a.hasAttribute('data-paket')) setSelect('f-paket', a.getAttribute('data-paket'));
    if (a.hasAttribute('data-calc-send')) {
      var s = calcState();
      setSelect('f-paket', PAKET[s.pkg]);
      var st = form.querySelector('.stepper');
      if (st && st._set) st._set(s.n);
    }
  });

  /* ---------- request form — draft: validates, then shows the thank-you state ----------
     Production: Web3Forms (hidden access_key + the botcheck honeypot already in place). */
  if (form) {
    var status = form.parentNode.querySelector('.form__status');
    var messages = {
      'f-name': 'Bitte gib deinen Namen an.',
      'f-tel': 'Bitte gib eine Telefonnummer an, damit wir zurückrufen können.',
      'f-mail': 'Bitte prüfe die E-Mail-Adresse.',
      'f-ok': 'Bitte bestätige die Datenschutzerklärung.'
    };
    var check = function (input) {
      var field = input.closest('.field');
      var err = document.getElementById(input.id + '-err');
      var ok = input.checkValidity();
      if (input.type === 'email' && ok && input.value) ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value);
      if (input.type === 'tel' && ok && input.value) ok = input.value.replace(/\D/g, '').length >= 6;
      field.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (err) {
        err.textContent = ok ? '' : messages[input.id];
        input.setAttribute('aria-describedby', err.id);
      }
      return ok;
    };
    var checked = form.querySelectorAll('[required]');
    checked.forEach(function (input) {
      input.addEventListener(input.type === 'checkbox' ? 'change' : 'blur', function () {
        if (input.value || input.type === 'checkbox') check(input);
      });
      input.addEventListener('input', function () { if (input.closest('.field').classList.contains('is-invalid')) check(input); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name="botcheck"]').checked) return;
      var firstBad = null;
      checked.forEach(function (input) { if (!check(input) && !firstBad) firstBad = input; });
      if (firstBad) { firstBad.focus(); return; }
      var name = form.querySelector('#f-name').value.trim().split(/\s+/)[0];
      var date = form.querySelector('#f-date').value;
      form.parentNode.classList.add('is-sent');
      status.textContent = 'Danke, ' + name + '! Deine Anfrage' + (date ? ' für den ' + date : '') +
        ' ist bei uns. Wir melden uns schnellstmöglich mit einer Bestätigung.';
      var cell = form.parentNode;
      if (cell.getBoundingClientRect().top < 0) cell.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc');
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
