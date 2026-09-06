"""Generate the site QR code (SVG) with the Nova logo in the middle.

Usage: python tools/make-qr.py [url]
Writes assets/qr-code.svg. Error correction is H (30%), so the centre logo
covering ~22% of the modules still scans reliably.
"""
import io, sys, re, os

import qrcode
from qrcode.constants import ERROR_CORRECT_H

URL = sys.argv[1] if len(sys.argv) > 1 else "https://novarefrigerationappliance.com/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "qr-code.svg")
LOGO = os.path.join(ROOT, "assets", "logo.svg")

QUIET = 4          # quiet zone, in modules (spec minimum)
DARK = "#0B2148"   # brand navy
LIGHT = "#ffffff"

qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, border=QUIET, box_size=1)
qr.add_data(URL)
qr.make(fit=True)
m = qr.get_matrix()          # already includes the quiet zone
n = len(m)

# Centre knockout: an odd number of modules so it sits symmetrically.
hole = int(n * 0.24) | 1
h0 = (n - hole) // 2
h1 = h0 + hole

rects = []
for y in range(n):
    x = 0
    while x < n:
        if m[y][x] and not (h0 <= x < h1 and h0 <= y < h1):
            run = 1
            while (x + run < n and m[y][x + run]
                   and not (h0 <= x + run < h1 and h0 <= y < h1)):
                run += 1
            rects.append(f'<rect x="{x}" y="{y}" width="{run}" height="1"/>')
            x += run
        else:
            x += 1

# Inline the logo, scaled into the knockout (with a little breathing room).
logo = io.open(LOGO, encoding="utf-8").read()
inner = re.sub(r"^[\s\S]*?<svg[^>]*>", "", logo)
inner = re.sub(r"</svg>\s*$", "", inner)
lw, lh = 153.0, 173.0
box = hole - 1.2
s = box / lh
w = lw * s
lx = h0 + (hole - w) / 2
ly = h0 + (hole - box) / 2

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {n} {n}" width="{n * 8}" height="{n * 8}" shape-rendering="crispEdges">
<title>{URL}</title>
<rect width="{n}" height="{n}" fill="{LIGHT}"/>
<g fill="{DARK}">
{chr(10).join(rects)}
</g>
<g shape-rendering="auto" transform="translate({lx:.3f} {ly:.3f}) scale({s:.5f})">{inner}</g>
</svg>
'''
io.open(OUT, "w", encoding="utf-8", newline="\n").write(svg)
print(f"wrote {OUT}  modules={n}  hole={hole}  url={URL}")
