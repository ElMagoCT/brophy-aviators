# Posters

11×17 in, print-ready. Every poster carries two QR codes: **Join** →
https://forms.gle/XQv9fGLGWvsgWXJi9 and **Hours** → this site.

```bash
cd posters/src
python3 gen_club.py     # member art -> 20-25 sheets (skips art that is missing)
python3 build.py        # all sheets -> ../NN-name.pdf + ../preview/NN-name.png
python3 build.py 03-fly-anywhere   # just one
python3 gen_qr.py       # only if a URL changes (needs: pip install --user qrcode)
```

`build.py` needs Google Chrome; it serves the folder over HTTP (Chrome blocks
`file://` fonts) and kills Chrome once the PDF stops growing (Chrome 154's
headless mode hangs after printing). Never edit the PDFs.

- **01–06, chart series** (`NN-*.html`): hand-written sheets on the kiosk's
  sectional-chart look. `03-fly-anywhere` computes its distances and bearings
  from airport coordinates in the page — edit the `DEST` list to change them.
- **20–25, member art** (`gen_club.py`): the club's own poster images in
  `src/club/`, fitted whole above a paper strip with the QR codes. Nothing is
  painted over the art. The images are ~1150 px wide, so 11×17 prints will be
  a little soft — a higher-resolution export can be dropped in under the same
  name.
- No `box-shadow` (prints as grey slabs); two fonts only.
