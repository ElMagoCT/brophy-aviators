/* Brophy Aviators Club - the sectional chart drawn under both pages.
 *
 * Pure SVG, generated once at load, no images, no network. A faint lat/long
 * graticule with minute ticks, tan terrain contours, Class B (blue) and
 * Class C (magenta) rings, two VOR compass roses with 10-degree ticks, dashed
 * airways with waypoint triangles, an isogonic line and a hatched MOA border.
 *
 * drawChart(el, { alpha: 1, tall: false }) - alpha scales every opacity.
 * tall:true draws an 11x17 portrait sheet (1056 x 1632) for the posters
 * instead of the kiosk's 1600 x 900. Seeded, so the chart is the same every load.
 * Copied from the kiosk (brophy-aviators-kiosk/chart.js); the tall layout is
 * the only addition.
 * ES5 on purpose (the reference kiosk's rule).
 */
(function(){
  "use strict";

  var W = 1600, H = 900;
  var BLUE = "#2b4d9c", MAG = "#b9348a", TEAL = "#2f7f8a", TAN = "#c8a765", INK = "#1c1c1c";

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function f(n){ return Math.round(n * 10) / 10; }
  function line(x1, y1, x2, y2, stroke, w, op, extra){
    return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) +
      '" stroke="' + stroke + '" stroke-width="' + w + '" opacity="' + op + '"' + (extra || '') + '/>';
  }
  function text(x, y, s, fill, size, op, extra){
    return '<text x="' + f(x) + '" y="' + f(y) + '" fill="' + fill + '" font-size="' + size +
      '" opacity="' + op + '" font-family="Share Tech Mono, Consolas, monospace"' + (extra || '') + '>' + s + '</text>';
  }

  function graticule(a){
    var out = [], x, y, i;
    var cols = W > H ? 10 : 6, rows = W > H ? 6 : 9, dx = W / cols, dy = H / rows;
    for(i = 0; i <= cols; i++){
      x = i * dx;
      out.push(line(x, 0, x, H, INK, 1, .16 * a));
      for(y = 0; y <= H; y += dy / 30){
        var big = Math.round(y / (dy / 30)) % 5 === 0;
        out.push(line(x - (big ? 6 : 3), y, x + (big ? 6 : 3), y, INK, 1, .16 * a));
      }
    }
    for(i = 0; i <= rows; i++){
      y = i * dy;
      out.push(line(0, y, W, y, INK, 1, .16 * a));
      for(x = 0; x <= W; x += dx / 30){
        var big2 = Math.round(x / (dx / 30)) % 5 === 0;
        out.push(line(x, y - (big2 ? 6 : 3), x, y + (big2 ? 6 : 3), INK, 1, .16 * a));
      }
    }
    /* 30-minute graticule labels, the Phoenix sectional's neighbourhood */
    for(i = 1; i < cols; i += 2){
      var lon = 113 - i * 0.5;
      var deg = Math.floor(lon), min = Math.round((lon - deg) * 60);
      out.push(text(i * dx + 8, 22, deg + '&#176;' + (min < 10 ? '0' : '') + min + "'W", INK, 12, .34 * a));
    }
    for(i = 1; i < rows; i++){
      var lat = 34 - i * 0.5;
      var d2 = Math.floor(lat), m2 = Math.round((lat - d2) * 60);
      out.push(text(8, i * dy - 8, d2 + '&#176;' + (m2 < 10 ? '0' : '') + m2 + "'N", INK, 12, .34 * a));
    }
    return out.join('');
  }

  /* Closed, wobbly contour rings - a polar radius with a few harmonics. */
  function contours(cx, cy, r0, n, r, a){
    var out = [], k, j, t;
    var harm = [];
    for(k = 0; k < 4; k++) harm.push({ amp: .06 + r() * .12, ph: r() * 6.283, k: k + 2 });
    for(j = 0; j < n; j++){
      var R = r0 * (1 - j * (0.8 / n)), d = '';
      for(t = 0; t <= 64; t++){
        var th = t / 64 * 6.283, rr = R;
        for(k = 0; k < harm.length; k++) rr += R * harm[k].amp * Math.sin(harm[k].k * th + harm[k].ph + j * .35);
        d += (t ? 'L' : 'M') + f(cx + Math.cos(th) * rr * 1.25) + ' ' + f(cy + Math.sin(th) * rr);
      }
      out.push('<path d="' + d + 'Z" fill="none" stroke="' + TAN + '" stroke-width="' + (j % 4 === 0 ? 1.8 : 1) + '" opacity="' + (.6 * a) + '"/>');
    }
    return out.join('');
  }

  function rings(cx, cy, radii, color, w, labels, a){
    var out = [], i;
    for(i = 0; i < radii.length; i++){
      out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + radii[i] + '" fill="none" stroke="' + color +
        '" stroke-width="' + w + '" opacity="' + (.42 * a) + '"/>');
      if(labels && labels[i]){
        var lx = cx + radii[i] * .72, ly = cy - radii[i] * .72;
        out.push(text(lx - 14, ly - 4, labels[i][0], color, 14, .6 * a, ' text-anchor="middle"'));
        out.push(line(lx - 30, ly + 2, lx + 2, ly + 2, color, 1.2, .6 * a));
        out.push(text(lx - 14, ly + 18, labels[i][1], color, 14, .6 * a, ' text-anchor="middle"'));
      }
    }
    return out.join('');
  }

  /* VOR compass rose: 10-degree ticks, longer every 30, numbered every 30,
     magnetic north arrow, hexagon VOR symbol at the middle. */
  function rose(cx, cy, R, name, freq, a){
    var out = [], d;
    out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + BLUE + '" stroke-width="1.4" opacity="' + (.55 * a) + '"/>');
    for(d = 0; d < 360; d += 5){
      var th = (d - 90) * Math.PI / 180;
      var len = d % 30 === 0 ? 16 : (d % 10 === 0 ? 10 : 5);
      out.push(line(cx + Math.cos(th) * R, cy + Math.sin(th) * R, cx + Math.cos(th) * (R - len), cy + Math.sin(th) * (R - len), BLUE, d % 10 === 0 ? 1.4 : 1, .55 * a));
      if(d % 30 === 0){
        out.push(text(cx + Math.cos(th) * (R - 30), cy + Math.sin(th) * (R - 30) + 5, String(d / 10), BLUE, 13, .6 * a, ' text-anchor="middle"'));
      }
    }
    out.push(line(cx, cy - R - 26, cx, cy - R + 2, BLUE, 1.6, .6 * a));
    out.push('<path d="M' + cx + ' ' + (cy - R - 34) + ' l-6 12 l12 0 z" fill="' + BLUE + '" opacity="' + (.6 * a) + '"/>');
    var hex = '', i;
    for(i = 0; i < 6; i++){ var t = i * Math.PI / 3; hex += (i ? 'L' : 'M') + f(cx + Math.cos(t) * 9) + ' ' + f(cy + Math.sin(t) * 9); }
    out.push('<path d="' + hex + 'Z" fill="none" stroke="' + BLUE + '" stroke-width="1.6" opacity="' + (.7 * a) + '"/>');
    out.push('<circle cx="' + cx + '" cy="' + cy + '" r="2" fill="' + BLUE + '" opacity="' + (.7 * a) + '"/>');
    /* the identifier box, the way a sectional prints it */
    out.push('<rect x="' + (cx + R * .45) + '" y="' + (cy + R + 10) + '" width="120" height="40" fill="#ffffff" stroke="' + BLUE + '" stroke-width="1.4" opacity="' + (.75 * a) + '"/>');
    out.push(text(cx + R * .45 + 60, cy + R + 27, name, BLUE, 14, .8 * a, ' text-anchor="middle"'));
    out.push(text(cx + R * .45 + 60, cy + R + 44, freq, BLUE, 13, .8 * a, ' text-anchor="middle"'));
    return out.join('');
  }

  function airway(x1, y1, x2, y2, label, a){
    var out = [];
    out.push(line(x1, y1, x2, y2, TEAL, 2, .55 * a, ' stroke-dasharray="14 8"'));
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    if(ang > 90) ang -= 180; if(ang < -90) ang += 180;
    out.push('<g transform="translate(' + f(mx) + ' ' + f(my) + ') rotate(' + f(ang) + ')">' +
      '<rect x="-30" y="-12" width="60" height="22" fill="#f7f5ee" opacity="' + (.9 * a) + '"/>' +
      text(0, 5, label, TEAL, 14, .8 * a, ' text-anchor="middle"') + '</g>');
    return out.join('');
  }

  function waypoint(x, y, name, a){
    return '<path d="M' + f(x) + ' ' + f(y - 9) + ' l8 14 l-16 0 z" fill="none" stroke="' + TEAL + '" stroke-width="1.8" opacity="' + (.75 * a) + '"/>' +
      text(x + 12, y + 18, name, TEAL, 13, .7 * a);
  }

  /* MOA: a thin magenta border with the hatch on its inside edge. */
  function moa(pts, name, sub, a){
    var d = '', i;
    for(i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + pts[i][0] + ' ' + pts[i][1];
    d += 'Z';
    var cx = 0, cy = 0;
    for(i = 0; i < pts.length; i++){ cx += pts[i][0]; cy += pts[i][1]; }
    cx /= pts.length; cy /= pts.length;
    return '<path d="' + d + '" fill="none" stroke="' + MAG + '" stroke-width="10" stroke-dasharray="1.6 7" opacity="' + (.42 * a) + '"/>' +
      '<path d="' + d + '" fill="none" stroke="' + MAG + '" stroke-width="1.4" opacity="' + (.55 * a) + '"/>' +
      text(cx, cy, name, MAG, 16, .6 * a, ' text-anchor="middle" letter-spacing="3"') +
      text(cx, cy + 20, sub, MAG, 13, .55 * a, ' text-anchor="middle"');
  }

  function tall(a, r){
    var vorA = { x: 720, y: 560 }, vorB = { x: 250, y: 1240 };
    return [
      graticule(a),
      contours(230, 300, 150, 7, r, a),
      contours(820, 1180, 150, 7, r, a),
      contours(330, 1500, 100, 5, r, a),
      rings(vorA.x, vorA.y, [150, 260, 380], BLUE, 2.6, [['100', 'SFC'], ['100', '40'], ['100', '60']], a),
      rings(230, 960, [70, 140], MAG, 2.4, [['41', 'SFC'], ['41', '20']], a),
      line(900, 0, 520, H, MAG, 1.4, .4 * a, ' stroke-dasharray="4 10"'),
      text(640, 1100, '10&#176;E', MAG, 14, .5 * a, ' transform="rotate(-77 640 1100)"'),
      airway(vorB.x, vorB.y, vorA.x, vorA.y, 'V105', a),
      airway(vorA.x, vorA.y, W, 260, 'V327', a),
      airway(vorA.x, vorA.y, W, 1300, 'V16', a),
      airway(vorB.x, vorB.y, 0, 820, 'V190', a),
      airway(vorB.x, vorB.y, 560, H, 'V95', a),
      waypoint(470, 920, 'BRPHY', a),
      waypoint(930, 960, 'ACES', a),
      waypoint(120, 1060, 'GRAND', a),
      moa([[640, 1250], [980, 1250], [1020, 1420], [640, 1420]], 'BRONCO MOA', '100 TO 180', a),
      rose(vorA.x, vorA.y, 92, 'BRO', '117.4', a),
      rose(vorB.x, vorB.y, 80, 'AVI', '112.8', a)
    ].join('');
  }

  window.drawChart = function(el, opts){
    if(!el) return;
    var a = (opts && typeof opts.alpha === "number") ? opts.alpha : 1;
    var r = rng(1931);   /* the year Brophy opened */
    if(opts && opts.tall){
      W = 1056; H = 1632;
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">' + tall(a, r) + '</svg>';
      return;
    }
    W = 1600; H = 900;
    var vorA = { x: 1170, y: 520 }, vorB = { x: 330, y: 650 };
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">',
      graticule(a),
      contours(520, 220, 150, 7, r, a),
      contours(1420, 160, 120, 6, r, a),
      contours(820, 820, 110, 5, r, a),
      rings(vorA.x, vorA.y, [130, 220, 320], BLUE, 2.6, [['100', 'SFC'], ['100', '40'], ['100', '60']], a),
      rings(470, 330, [70, 140], MAG, 2.4, [['41', 'SFC'], ['41', '20']], a),
      line(980, 0, 760, H, MAG, 1.4, .4 * a, ' stroke-dasharray="4 10"'),
      text(840, 600, '10&#176;E', MAG, 14, .5 * a, ' transform="rotate(-76 840 600)"'),
      airway(vorB.x, vorB.y, vorA.x, vorA.y, 'V105', a),
      airway(vorA.x, vorA.y, 1600, 300, 'V327', a),
      airway(vorA.x, vorA.y, 1450, 900, 'V16', a),
      airway(vorB.x, vorB.y, 0, 420, 'V190', a),
      airway(vorB.x, vorB.y, 200, 900, 'V95', a),
      waypoint(750, 585, 'BRPHY', a),
      waypoint(1385, 410, 'ACES', a),
      waypoint(150, 545, 'GRAND', a),
      /* bottom middle: under the cards on both pages, never behind loose text */
      moa([[700, 690], [1010, 690], [1060, 870], [700, 870]], 'BRONCO MOA', '100 TO 180', a),
      rose(vorA.x, vorA.y, 92, 'BRO', '117.4', a),
      rose(vorB.x, vorB.y, 80, 'AVI', '112.8', a),
      '</svg>'
    ];
    el.innerHTML = svg.join('');
  };
})();
