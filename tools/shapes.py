"""© 2026 Mykhailo Sibahatov. Alle Rechte vorbehalten. Siehe LICENSE.
Generates the hand-made-looking shapes of the draft: paint splats (SVG symbols),
the torn paper edge (CSS mask) and the brush-stroke marker. Seeded, so reruns are stable.
Run: python3 tools/shapes.py > tools/shapes.out  (then paste into index.html / styles.css)"""
import math, random, urllib.parse

def smooth(pts):
    """closed Catmull-Rom through pts -> cubic bezier path"""
    n = len(pts); d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = pts[i-1], pts[i], pts[(i+1) % n], pts[(i+2) % n]
        c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6)
        c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + "Z"

def circle(cx, cy, r):
    return f"M{cx-r:.1f} {cy:.1f}a{r:.1f} {r:.1f} 0 1 1 {2*r:.1f} 0a{r:.1f} {r:.1f} 0 1 1 {-2*r:.1f} 0Z"

def splat(seed, R=46, spikes=9):
    rnd = random.Random(seed)
    lobes = [(rnd.uniform(0, 2*math.pi), rnd.uniform(.2, .6)*R, rnd.uniform(.08, .19)) for _ in range(spikes)]
    pts = []
    N = 96
    for k in range(N):
        t = 2*math.pi*k/N
        r = R*(1 + .07*math.sin(3*t + seed) + .05*math.sin(7*t + 2*seed))
        for (a, A, w) in lobes:
            da = math.atan2(math.sin(t-a), math.cos(t-a))
            r += A*math.exp(-(da/w)**2)
        pts.append((r*math.cos(t), r*math.sin(t)))
    d = smooth(pts)
    # droplets flung along some spikes, plus a few loose ones
    for (a, A, w) in lobes:
        if rnd.random() < .7:
            dist = R + A + rnd.uniform(6, 18)
            d += circle(dist*math.cos(a), dist*math.sin(a), rnd.uniform(2.2, 5.5))
    for _ in range(5):
        a = rnd.uniform(0, 2*math.pi); dist = rnd.uniform(R*1.25, R*1.95)
        d += circle(dist*math.cos(a), dist*math.sin(a), rnd.uniform(1.4, 3.6))
    return d

def torn(seed, W=1440, H=48):
    """jagged top edge; filled below. Small tears plus a few deeper bites."""
    rnd = random.Random(seed)
    x, y = 0, H*.55
    pts = [(0, H)]
    while x < W:
        pts.append((x, y))
        x += rnd.uniform(2, 8)
        y += rnd.uniform(-3.2, 3.2)
        if rnd.random() < .04: y -= rnd.uniform(6, 14)   # a flake that sticks up
        if rnd.random() < .04: y += rnd.uniform(5, 10)   # a bite
        y = max(4, min(H-8, y*.9 + H*.55*.1))
    pts.append((W, y)); pts.append((W, H))
    return "M" + "L".join(f"{p[0]:.0f} {p[1]:.1f}" for p in pts) + "Z"

def brush(seed):
    """a flat brush swipe with dry, streaky ends (viewBox 0 0 200 40)"""
    rnd = random.Random(seed)
    top = [(x, 7 + rnd.uniform(-1.6, 1.6)) for x in range(8, 193, 8)]
    bot = [(x, 34 + rnd.uniform(-1.6, 1.6)) for x in range(192, 7, -8)]
    d = "M" + "L".join(f"{x:.0f} {y:.1f}" for x, y in top + bot) + "Z"
    for side in (0, 1):
        for i in range(5):
            y = 9 + i*5.6 + rnd.uniform(-1, 1)
            L = rnd.uniform(6, 16); h = rnd.uniform(1.2, 2.6)
            x0 = 8 if side == 0 else 192
            x1 = x0 - L if side == 0 else x0 + L
            d += f"M{x0} {y:.1f}L{x1:.1f} {y+h/2:.1f}L{x0} {y+h:.1f}Z"
    return d

if __name__ == "__main__":
    for i, s in enumerate([3, 11, 27, 42]):
        print(f'<symbol id="splat-{i+1}" viewBox="-110 -110 220 220"><path d="{splat(s)}"/></symbol>')
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='-110 -110 220 220'><path d='{splat(19)}'/></svg>"
    print("--splat-mask: url(\"data:image/svg+xml," + urllib.parse.quote(svg, safe="/:=' ") + "\");")
    t = torn(5)
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 48' preserveAspectRatio='none'><path d='{t}'/></svg>"
    print("--torn: url(\"data:image/svg+xml," + urllib.parse.quote(svg, safe="/:=' ") + "\");")
    b = brush(8)
    for name, col, op in (("marker", "%23EC4C8A", ".42"), ("marker-night", "%23EC4C8A", ".78"), ("marker-green", "%2362C22B", ".5")):
        svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40' preserveAspectRatio='none'><path d='{b}' fill='{col}' fill-opacity='{op}'/></svg>"
        print(f"--{name}: url(\"data:image/svg+xml," + urllib.parse.quote(svg, safe="/:=' %") + "\");")
