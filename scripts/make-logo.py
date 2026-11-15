"""Generates the Lugha Zetu mark: a speech bubble woven from rings of beadwork.
Writes public/icons/logo-mark.svg (mark only, transparent) and public/icons/icon.svg (app icon)."""
import math, pathlib

RED, BLUE, GREEN, GOLD, BLACK, WHITE = '#C8102E', '#1B5FA8', '#1E7A46', '#E8A317', '#22160F', '#FFFFFF'
CREAM, TERRA, TERRA_DARK = '#FFF8F0', '#D9541E', '#A93E12'

def beads(cx, cy, radius, r, colors):
    n = max(6, int(2 * math.pi * radius / (2.25 * r)))
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n - math.pi / 2
        x, y = cx + radius * math.cos(a), cy + radius * math.sin(a)
        c = colors[i % len(colors)]
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{c}"/>'
                   f'<circle cx="{x - r*0.32:.1f}" cy="{y - r*0.32:.1f}" r="{r*0.3:.1f}" fill="#fff" opacity=".35"/>')
    return ''.join(out)

def mark():
    """Mark drawn in a 512x512 box."""
    cx, cy, R = 256, 236, 176
    # Bubble: circle plus a tail at the lower left.
    bubble = (f'<path d="M{cx-118} {cy+130} L{cx-150} {cy+205} L{cx-58} {cy+162} Z" fill="{CREAM}"/>'
              f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="{CREAM}"/>')
    rings = (beads(cx, cy, 140, 17, [RED, RED, RED, WHITE, BLACK, WHITE])
             + beads(cx, cy, 98, 16, [BLUE])
             + beads(cx, cy, 58, 15, [GREEN, GOLD])
             + f'<circle cx="{cx}" cy="{cy}" r="20" fill="{RED}"/>')
    # White beads need an outline to show on cream.
    rings = rings.replace(f'fill="{WHITE}"/>', f'fill="{WHITE}" stroke="#d9c7b5" stroke-width="2"/>')
    return bubble + rings

icons = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'icons'
(icons / 'logo-mark.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{mark()}</svg>\n')
(icons / 'icon.svg').write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
    f'<rect width="512" height="512" rx="112" fill="{TERRA}"/>'
    f'<g transform="translate(26 30) scale(.9)">{mark()}</g></svg>\n')
print('ok')
