# Brophy Aviators website — notes for Claude

Public repo **https://github.com/ElMagoCT/brophy-aviators**, GitHub Pages at
**https://elmagoct.github.io/brophy-aviators/** (pushes to `main` publish). Built
2026-10-07. Live hours board for the Aviators MSFS kiosk + 11x17 posters, in the
kiosk's sectional-chart look (Barlow + Share Tech Mono only). See `README.md`.

- `data.json` is written ONLY by the kiosk PC (`Publish-Site.ps1` in the private
  `brophy-aviators-kiosk` repo, scheduled task every 15 min) — **pull first**.
  As of 2026-10-07 the kiosk side is unverified: `SETUP-WEBSITE.md` in the kiosk
  repo is the paste-in prompt for the kiosk PC.
- Posters: `cd posters/src && python3 gen_club.py && python3 build.py`. 01-06 are
  chart-series sheets; 20-25 frame the members' own art (`src/club/`) above a QR strip.
- Preview: `python3 -m http.server 8796`.
