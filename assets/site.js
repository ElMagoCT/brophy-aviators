/* Brophy Aviators - the home page. Reads data.json (written by the kiosk's
   Publish-Site.ps1 every 15 minutes) and draws it. No framework, no build.

   Times: the kiosk resolves the opening hours to absolute instants (startIso /
   endIso with the Arizona offset baked in), so "is the lab open" is just a
   comparison against Date.now() and is right in any visitor's timezone. Times
   are DISPLAYED in the lab's zone (America/Phoenix). */
(function () {
  'use strict';
  var TZ = 'America/Phoenix';
  var WEEK = 7 * 864e5;
  var data = null, sortBy = 'week', query = '';

  drawChart(document.getElementById('chart'), { alpha: .8, tall: window.innerHeight > window.innerWidth });   /* phones get the portrait chart */

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hours(ms) { var h = (ms || 0) / 36e5; return h >= 100 ? Math.round(h) + 'h' : h.toFixed(1) + 'h'; }
  function hm(ms) {
    var m = Math.round((ms || 0) / 6e4), h = Math.floor(m / 60);
    return h ? h + 'h ' + (m % 60) + 'm' : m + 'm';
  }
  function fmt(d, opts) { opts.timeZone = TZ; return new Intl.DateTimeFormat('en-US', opts).format(d); }
  function clock(d) { return fmt(d, { hour: 'numeric', minute: '2-digit' }); }
  var KEY = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  /* 7:00, 2:30 - a school day needs no AM/PM, and it keeps each window on one line */
  function short(d) { return fmt(d, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/, ''); }
  function dayKey(d) { return KEY.format(d); }   /* YYYY-MM-DD in the lab's zone */
  function ago(ms) {
    var m = Math.round((Date.now() - ms) / 6e4);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    var d = Math.round(h / 24);
    return d + (d === 1 ? ' day ago' : ' days ago');
  }
  function when(ms) {
    var d = new Date(ms), today = dayKey(new Date()), yest = dayKey(new Date(Date.now() - 864e5));
    var k = dayKey(d), t = clock(d);
    if (k === today) return 'Today, ' + t;
    if (k === yest) return 'Yesterday, ' + t;
    return fmt(d, { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + t;
  }

  /* A week's numbers are only this week's until the next Sunday. If the kiosk
     has been quiet since then (no publish), show them as zero, as the kiosk does. */
  function weekValid() { return data && data.weekStart && Date.now() < data.weekStart + WEEK; }
  function weekMs(p) { return weekValid() ? (p.weekMs || 0) : 0; }

  /* ---------------------------------------------------------- status */
  function windows() {
    var out = [];
    ((data && data.schedule && data.schedule.days) || []).forEach(function (day) {
      (day.windows || []).forEach(function (w) { out.push({ s: Date.parse(w.startIso), e: Date.parse(w.endIso) }); });
    });
    return out.sort(function (a, b) { return a.s - b.s; });
  }
  function drawStatus() {
    var el = $('status'), now = Date.now(), ws = windows(), cur = null, next = null;
    for (var i = 0; i < ws.length; i++) {
      if (ws[i].s <= now && now < ws[i].e) { cur = ws[i]; break; }
      if (ws[i].s > now) { next = ws[i]; break; }
    }
    el.className = 'card status ' + (cur ? 'open teal' : 'closed red');
    $('st-big').textContent = cur ? 'OPEN' : 'CLOSED';
    if (cur) {
      $('st-until').textContent = 'Until ' + clock(new Date(cur.e));
    } else if (next) {
      var same = dayKey(new Date(next.s)) === dayKey(new Date());
      $('st-until').textContent = 'Opens ' + (same ? 'at ' : fmt(new Date(next.s), { weekday: 'long' }) + ' ') + clock(new Date(next.s));
    } else {
      $('st-until').textContent = ws.length ? 'No flying time posted in the next few weeks' : 'Lab hours not posted yet';
    }
    $('st-note').textContent = 'From the posted lab hours. Officers can open it outside them for club meetings.';
  }

  /* ---------------------------------------------------------- board */
  function drawBoard() {
    var pilots = ((data && data.pilots) || []).slice();
    pilots.sort(function (a, b) {
      var x = sortBy === 'week' ? weekMs(b) - weekMs(a) : 0;
      return x || (b.totalMs - a.totalMs) || a.name.localeCompare(b.name);
    });
    var q = query.trim().toLowerCase(), rows = [], shown = 0, LIMIT = 25;
    pilots.forEach(function (p, i) {
      var hit = q && p.name.toLowerCase().indexOf(q) >= 0;
      if (q && !hit) return;
      if (!q && i >= LIMIT) return;
      shown++;
      var w = weekMs(p);
      rows.push('<tr class="' + (i < 3 ? 'top3 ' : '') + (hit ? 'hit' : '') + '"><td class="n">' + (i + 1) + '</td><td>' + esc(p.name) +
        (p.lastSeen ? '<span class="seen">last flew ' + ago(p.lastSeen) + '</span>' : '') + '</td>' +
        '<td class="r' + (w ? '' : ' dim') + '">' + (w ? hours(w) : '&mdash;') + '</td><td class="r">' + hours(p.totalMs) + '</td></tr>');
    });
    if (!pilots.length) rows.push('<tr><td colspan="4" class="empty">No pilots yet &mdash; the board fills in after the kiosk\'s first upload. Be the first name on it.</td></tr>');
    else if (!shown) rows.push('<tr><td colspan="4" class="empty">No pilot called &ldquo;' + esc(query) + '&rdquo;. Sign in on the kiosk with your first name and last initial.</td></tr>');
    $('rows').innerHTML = rows.join('');
    $('more').textContent = (!q && pilots.length > LIMIT) ? 'Top ' + LIMIT + ' of ' + pilots.length + ' pilots. Search to find yours.' :
      (pilots.length ? 'Ranked by ' + (sortBy === 'week' ? 'hours this week, then all-time.' : 'all-time hours.') : '');
  }

  /* ---------------------------------------------------------- flights, hours, stats */
  function drawFlights() {
    var list = (data && data.recent) || [];
    $('flights').innerHTML = list.length ? list.slice(0, 12).map(function (f) {
      return '<li><span><span class="who">' + esc(f.name) + '</span><span class="when">' + when(f.start) + '</span></span><span class="len">' + hm(f.flownMs) + '</span></li>';
    }).join('') : '<li class="empty">No flights logged yet.</li>';
  }
  function drawWeek() {
    var days = ((data && data.schedule && data.schedule.days) || []).slice(0, 7), today = dayKey(new Date());
    $('week').innerHTML = days.length ? days.map(function (d) {
      var isToday = d.date === today;
      var w = d.windows && d.windows.length ? d.windows.map(function (x) {
        return short(new Date(x.startIso)) + '&ndash;' + short(new Date(x.endIso));
      }).join('<br>') : esc(d.note || 'Closed');
      return '<div class="day' + (isToday ? ' today' : '') + (d.open ? '' : ' shut') + '"><div class="d">' + esc(d.dow) + ' ' + esc(d.label) + '</div><div class="w">' + w + '</div></div>';
    }).join('') : '<div class="empty">Lab hours appear here after the kiosk\'s first upload.</div>';
    $('h-src').textContent = (data && data.schedule && data.schedule.closedLabel) ? 'Gaps = ' + data.schedule.closedLabel.toLowerCase() : '';
  }
  function drawStats() {
    var t = (data && data.totals) || {}, wk = 0;
    ((data && data.pilots) || []).forEach(function (p) { wk += weekMs(p); });
    $('s-week').textContent = hours(wk);
    $('s-all').textContent = hours(t.clubMs || 0);
    $('s-pilots').textContent = t.pilots || 0;
    $('s-active').textContent = t.activePilots7 || 0;
    $('updated').textContent = data && data.generated ? 'Updated ' + ago(data.generated) : 'Waiting for the kiosk';
  }
  function drawStrip() {
    /* three of the chart series, three of the members' own */
    var all = window.POSTERS || [], chart = all.filter(function (p) { return p.by !== 'club'; }), club = all.filter(function (p) { return p.by === 'club'; });
    var pick = [chart[0], club[0], chart[1], club[1], chart[2], club[2]].filter(Boolean);
    $('strip').innerHTML = pick.map(function (p) {
      return '<a href="posters/' + p.file + '.pdf" title="' + esc(p.title) + '"><img loading="lazy" src="posters/preview/' + p.file + '.png" alt="' + esc(p.title) + ' poster"></a>';
    }).join('');
  }

  function drawAll() { drawStatus(); drawStats(); drawBoard(); drawFlights(); drawWeek(); }

  Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
    b.addEventListener('click', function () {
      sortBy = b.getAttribute('data-sort');
      Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      drawBoard();
    });
  });
  $('find').addEventListener('input', function (e) { query = e.target.value; drawBoard(); });

  function load() {
    fetch('data.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { data = j; drawAll(); })
      .catch(function () { if (!data) { data = {}; drawAll(); $('updated').textContent = 'Could not load the latest numbers'; } });
  }
  drawStrip();
  load();
  setInterval(load, 5 * 6e4);          /* new numbers land every ~15 min */
  setInterval(drawStatus, 3e4);        /* open/closed flips on the minute */
})();
