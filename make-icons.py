#!/usr/bin/env python3
"""Draw the home screen icons: a gas cylinder with a level in it.

Run it from the repo folder with no arguments and no dependencies:

    python3 make-icons.py

It overwrites icon-512.png, icon-192.png and apple-touch-icon.png. Nothing
else uses it, so you only need it if you want to change how the icon looks.

icon.svg is the same drawing by hand, in the same 512 by 512 space and with
the same numbers. Change one and change the other, or they will drift apart.

To restyle the icon, edit the three colours and the five boxes below. Each box
is (left, top, right, bottom, corner radius). Everything is drawn a row at a
time as a span of pixels, then averaged down from a larger rendering, which is
what smooths the edges.
"""

import math, struct, zlib

BG     = (0x10, 0x20, 0x2f)
WHITE  = (0xff, 0xff, 0xff)
ACCENT = (0x4f, 0x91, 0xff)

# geometry in a 512 x 512 design space
BODY  = (176, 186, 336, 400, 48)   # x0,y0,x1,y1,radius
NECK  = (234, 138, 278, 200, 0)
CAP   = (210, 114, 302, 150, 16)
INNER = (196, 206, 316, 380, 34)   # the blue level sits inside this
LEVEL_TOP = 300

def rspan(y, box):
    x0, y0, x1, y1, r = box
    if y < y0 or y > y1:
        return None
    if r > 0 and y < y0 + r:
        dy = (y0 + r) - y
        dx = r - math.sqrt(max(0.0, r * r - dy * dy))
    elif r > 0 and y > y1 - r:
        dy = y - (y1 - r)
        dx = r - math.sqrt(max(0.0, r * r - dy * dy))
    else:
        dx = 0.0
    return (x0 + dx, x1 - dx)

def draw_row(row, n, y, scale):
    """Paint one hi-res scanline. y is in design space, row is n px wide."""
    def fill(span, color):
        if not span:
            return
        a = max(0, int(round(span[0] * scale)))
        b = min(n, int(round(span[1] * scale)))
        for x in range(a, b):
            i = x * 3
            row[i], row[i + 1], row[i + 2] = color
    fill(rspan(y, CAP), WHITE)
    fill(rspan(y, NECK), WHITE)
    fill(rspan(y, BODY), WHITE)
    if y >= LEVEL_TOP:
        fill(rspan(y, INNER), ACCENT)

def render(size, ss):
    n = size * ss
    scale = n / 512.0
    out = bytearray()
    acc = None
    for hy in range(n):
        row = bytearray()
        for _ in range(size * ss):
            row += bytes(BG)
        draw_row(row, n, (hy + 0.5) / scale, scale)
        if acc is None:
            acc = [0] * (size * 3)
        for ox in range(size):
            base = ox * ss * 3
            for c in range(3):
                acc[ox * 3 + c] += sum(row[base + c: base + ss * 3: 3])
        if hy % ss == ss - 1:
            out.append(0)  # PNG filter: none
            div = ss * ss
            out += bytes((v // div) for v in acc)
            acc = None
    return bytes(out)

def chunk(tag, data):
    return (struct.pack(">I", len(data)) + tag + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))

def write_png(path, size, ss):
    raw = render(size, ss)
    head = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", head)
           + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))
    open(path, "wb").write(png)
    print(path, size, len(png), "bytes")

write_png("icon-512.png", 512, 3)
write_png("icon-192.png", 192, 4)
write_png("apple-touch-icon.png", 180, 4)
