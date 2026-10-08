#!/usr/bin/env python3
"""Writes the two poster QR codes as plain SVG (module squares, no quiet zone -
the poster gives each code its own white tile).

    qr-join.svg  -> the club's Google Form sign-up
    qr-site.svg  -> this website (live hours + leaderboard)

Needs `python3 -m pip install --user qrcode`. Rerun only if a URL changes.
"""
import os, qrcode

HERE = os.path.dirname(os.path.abspath(__file__))
INK = '#1c1c1c'
CODES = {
    'qr-join': 'https://forms.gle/XQv9fGLGWvsgWXJi9',
    'qr-site': 'https://elmagoct.github.io/brophy-aviators/',
}

for name, url in CODES.items():
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    q.add_data(url); q.make(fit=True)
    m = q.get_matrix(); n = len(m)
    d = []
    for y, row in enumerate(m):
        x = 0
        while x < n:
            if row[x]:
                s = x
                while x < n and row[x]: x += 1
                d.append('M%d %dh%dv1h-%dz' % (s, y, x - s, x - s))
            else:
                x += 1
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" shape-rendering="crispEdges">'
           '<path fill="%s" d="%s"/></svg>\n' % (n, n, INK, ''.join(d)))
    with open(os.path.join(HERE, name + '.svg'), 'w') as f: f.write(svg)
    print(name, n, 'modules ->', url)
