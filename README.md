# Brophy Aviators Club — website

Live hours, leaderboard and posters for the club's flight simulator
(Microsoft Flight Simulator 2024, yoke + pedals, VR on a motion rig).

**Live:** https://elmagoct.github.io/brophy-aviators/ (GitHub Pages; pushes to `main` publish).
Plain HTML/CSS/JS, no build step. Same sectional-chart look and the same two
fonts (Barlow, Share Tech Mono) as the kiosk.

| Path | |
|---|---|
| `index.html`, `assets/site.js`, `assets/site.css` | the home page: open/closed, stats, leaderboard (week / all-time, name search), recent flights, next 7 days of lab hours, join |
| `assets/chart.js` | the sectional chart background, copied from the kiosk; adds a `tall` (portrait) layout used by phones and the posters |
| `assets/posters.js` | the poster list shared by the home page and `posters/` |
| `data.json` | **written by the kiosk, never by hand** (see below) |
| `posters/` | gallery page, print-ready 11×17 PDFs, `preview/` PNGs |
| `posters/src/` | poster sources — see `posters/README.md` |

## Where the numbers come from

The kiosk PC (`ElMagoCT/brophy-aviators-kiosk`, private) runs
`Publish-Site.ps1` every 15 minutes as the scheduled task "Brophy Aviators Site
Publish". It reads the kiosk's pilot store, flight log and opening hours and
commits ONE derived `data.json` here (names and hours only — no ids), pulling
before it pushes. Edit pages and posters from anywhere; the kiosk only ever
touches `data.json`. **Pull before you push** — the kiosk commits here all day.

`data.json` shape: `generated` (ms), `weekStart` (Sunday 00:00 Arizona, ms),
`totals`, `pilots[] {name,totalMs,weekMs,lastSeen,flights}`,
`recent[] {name,start,flownMs}` (newest first), `schedule.days[]` with
`windows[] {from,to,startIso,endIso}` as absolute Arizona instants. The page
treats week numbers as zero once `weekStart` is more than 7 days old.

## Preview

```bash
cd brophy-aviators && python3 -m http.server 8796
```

The committed `data.json` is empty until the kiosk's first upload; the page
says so rather than showing made-up pilots.
