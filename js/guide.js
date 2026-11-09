/* Station guide shown after payment: an illustrated station concourse with the
   colour-coded footstep stickers on the floor. The passenger's trail glows in a wave
   towards their stairs and a figure walks along it; the other trail stays dim.
   The scene is drawn in one-point perspective on a 1600×1200 canvas. */

const SCENE = { w: 1600, h: 1200, vx: 800, vy: 520, back: 0.42 };

// A front-plane point (x, y) pushed back to depth f: 1 is the picture's front edge, SCENE.back the back wall.
const at = (x, y, f) => [SCENE.vx + (x - SCENE.vx) * f, SCENE.vy + (y - SCENE.vy) * f];
const pts = list => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const poly = (list, attrs) => `<polygon points="${pts(list)}" ${attrs}/>`;

// A patch of a side wall between depths f1 > f2 and heights v1 < v2 (0 = floor, 1 = ceiling).
function wallPatch(side, f1, f2, v1, v2, attrs) {
  const x = side === 'L' ? 0 : SCENE.w;
  const y = v => SCENE.h - v * SCENE.h;
  return poly([at(x, y(v1), f1), at(x, y(v2), f1), at(x, y(v2), f2), at(x, y(v1), f2)], attrs);
}

// A patch of floor (y = SCENE.h) or ceiling (y = 0) between front-plane x1..x2 and depths f1 > f2.
const flat = (x1, x2, f1, f2, y, attrs) => poly([at(x1, y, f1), at(x2, y, f1), at(x2, y, f2), at(x1, y, f2)], attrs);

// Floor perspective for the footprints: they shrink towards the horizon and flatten with distance.
const FLOOR = { horizon: SCENE.vy, near: SCENE.h };
const depth = y => Math.max(0.08, (y - FLOOR.horizon) / (FLOOR.near - FLOOR.horizon));

// Left stairs go up to Platform 2 (towards the line's first station), right stairs to Platform 1.
const TRAILS = {
  2: { from: [630, 1230], ctrl: [500, 1000], to: [628, 820] },
  1: { from: [970, 1230], ctrl: [1100, 1000], to: [972, 820] }
};
const STAIRS = {
  2: { escalator: [492, 566], steps: [576, 692], pin: 600 },
  1: { escalator: [1034, 1108], steps: [908, 1024], pin: 1000 }
};
const OPENING = { top: 470, bottom: 806 };

const GLOW = { 1: '#ffd54a', 2: '#7fdcff' };

// One foot, toes up, about 1.4 units long.
const FOOT = `<ellipse cx="0" cy="0.18" rx="0.27" ry="0.5"/><ellipse cx="0" cy="0.62" rx="0.2" ry="0.16"/>
  <circle cx="-0.2" cy="-0.42" r="0.085"/><circle cx="-0.08" cy="-0.5" r="0.095"/><circle cx="0.05" cy="-0.51" r="0.09"/>
  <circle cx="0.16" cy="-0.46" r="0.08"/><circle cx="0.24" cy="-0.37" r="0.07"/>`;

function bezier(tr, t) {
  const [a, c, b] = [tr.from, tr.ctrl, tr.to];
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

// Footprints evenly spaced on the floor, which means closer together on screen as they recede.
function footsteps(tr) {
  const steps = [];
  let t = 0;
  let [x, y] = bezier(tr, 0);
  let side = 1;
  while (t < 1) {
    const s = depth(y);
    const stride = 68 * s;
    let nt = t, nx = x, ny = y;
    while (nt < 1 && Math.hypot(nx - x, ny - y) < stride) {
      nt += 0.002;
      [nx, ny] = bezier(tr, nt);
    }
    const squash = 0.32 + 0.33 * s;                // a shape lying on the floor looks flatter further away
    const heading = Math.atan2(nx - x, -(ny - y) / squash) * 180 / Math.PI;
    const len = Math.hypot(nx - x, ny - y) || 1;
    const off = 20 * s * side;                     // left and right feet sit either side of the line
    steps.push({ x: x + (-(ny - y) / len) * off, y: y + ((nx - x) / len) * off * squash, size: 64 * s, squash, heading, side });
    t = nt; x = nx; y = ny; side = -side;
  }
  return steps.slice(0, -1);
}

/* ---------- the concourse ---------- */

function ceiling() {
  const B = SCENE.back;
  let svg = poly([[0, 0], [SCENE.w, 0], at(SCENE.w, 0, B), at(0, 0, B)], 'fill="#f2f4f6"');
  for (const x of [0, 320, 640, 960, 1280, 1600]) {
    const [bx, by] = at(x, 0, B);
    svg += `<line x1="${x}" y1="0" x2="${bx}" y2="${by}" stroke="#dde2e7" stroke-width="6"/>`;
  }
  for (const f of [0.86, 0.7, 0.58, 0.49]) {
    const [x1, y] = at(0, 0, f);
    svg += `<line x1="${x1}" y1="${y}" x2="${SCENE.w - x1}" y2="${y}" stroke="#d6dce2" stroke-width="${(14 * f).toFixed(1)}"/>`;
  }
  for (const f of [0.95, 0.77, 0.63, 0.53]) svg += flat(660, 940, f, f - 0.035, 0, 'fill="#fffbe8" class="lamp"');
  return svg;
}

function sideWalls() {
  const B = SCENE.back;
  let svg = poly([[0, 0], at(0, 0, B), at(0, SCENE.h, B), [0, SCENE.h]], 'fill="#e9edf1"');
  svg += poly([[SCENE.w, 0], at(SCENE.w, 0, B), at(SCENE.w, SCENE.h, B), [SCENE.w, SCENE.h]], 'fill="#e2e7ec"');
  for (const side of ['L', 'R']) {
    svg += wallPatch(side, 1, B, 0, 0.045, 'fill="#bfc6ce"');                                  // skirting
    svg += wallPatch(side, 0.98, 0.6, 0.6, 0.8, `fill="${side === 'L' ? '#e8a23a' : '#de8a2e'}"`); // mural band
    for (const [f1, f2] of [[0.95, 0.84], [0.82, 0.71], [0.69, 0.61]]) {
      svg += wallPatch(side, f1, f2, 0.63, 0.77, 'fill="#f6d9a6" opacity="0.55"');           // mural panels
    }
    svg += wallPatch(side, 0.8, 0.69, 0.045, 0.5, 'fill="#9aa3ad"');                        // lift frame
    svg += wallPatch(side, 0.79, 0.7, 0.045, 0.47, 'fill="#c3cad1"');                        // lift doors
    svg += wallPatch(side, 0.745, 0.744, 0.045, 0.47, 'fill="#8b949e" stroke="#8b949e" stroke-width="3"');
  }
  svg += wallPatch('L', 0.94, 0.87, 0.28, 0.44, 'fill="#f7fbf7" stroke="#3c9a5f" stroke-width="4"'); // station map
  svg += wallPatch('R', 0.9, 0.865, 0.1, 0.4, 'fill="#d64545"');                                     // fire cabinet
  return svg;
}

function stairsAndEscalator(pf) {
  const st = STAIRS[pf];
  const { top, bottom } = OPENING;
  const x1 = Math.min(st.escalator[0], st.steps[0]) - 8;
  const x2 = Math.max(st.escalator[1], st.steps[1]) + 8;
  let svg = `<rect x="${x1}" y="${top}" width="${x2 - x1}" height="${bottom - top}" fill="url(#opening)"/>`;
  // Steps rise away from us: treads crowd together towards the top.
  const n = 13;
  const yAt = i => bottom - (bottom - top - 40) * (1 - 0.86 ** i) / (1 - 0.86 ** n);
  for (let i = 0; i < n; i++) {
    const inset = i * 1.6;
    svg += `<rect x="${st.steps[0] + inset}" y="${yAt(i + 1)}" width="${st.steps[1] - st.steps[0] - inset * 2}" height="${yAt(i) - yAt(i + 1)}" fill="${i % 2 ? '#c9cfd5' : '#e1e5e9'}"/>`;
  }
  svg += `<line x1="${st.steps[0]}" y1="${bottom}" x2="${st.steps[0] + 20}" y2="${top + 40}" stroke="#7b848e" stroke-width="5"/>`;
  svg += `<line x1="${st.steps[1]}" y1="${bottom}" x2="${st.steps[1] - 20}" y2="${top + 40}" stroke="#7b848e" stroke-width="5"/>`;
  // Escalator: a dark belt with steps sliding upwards, between glass sides.
  const [e1, e2] = st.escalator;
  svg += `<clipPath id="esc${pf}"><rect x="${e1 + 8}" y="${top + 30}" width="${e2 - e1 - 16}" height="${bottom - top - 30}"/></clipPath>`;
  svg += `<rect x="${e1 + 8}" y="${top + 30}" width="${e2 - e1 - 16}" height="${bottom - top - 30}" fill="#454b53"/>`;
  svg += `<g clip-path="url(#esc${pf})"><g class="esc-move">`;
  for (let y = top + 10; y < bottom + 30; y += 18) {
    svg += `<rect x="${e1 + 10}" y="${y}" width="${e2 - e1 - 20}" height="5" fill="#8e979f"/>`;
  }
  svg += '</g></g>';
  for (const ex of [e1, e2 - 10]) {
    svg += `<rect x="${ex}" y="${top + 20}" width="10" height="${bottom - top - 20}" fill="#cfe7f3" opacity="0.8"/>`;
    svg += `<line x1="${ex + 5}" y1="${top + 20}" x2="${ex + 5}" y2="${bottom - 30}" stroke="#2f343a" stroke-width="6" stroke-linecap="round"/>`;
  }
  svg += `<rect x="${x1}" y="${top - 14}" width="${x2 - x1}" height="14" fill="#9aa3ad"/>`;
  return svg;
}

function backWall() {
  const [x1, y1] = at(0, 0, SCENE.back);
  const [x2, y2] = at(SCENE.w, SCENE.h, SCENE.back);
  return `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="#e0e5e9"/>` +
    stairsAndEscalator(2) + stairsAndEscalator(1);
}

function floor() {
  const B = SCENE.back;
  let svg = `<clipPath id="floor-clip">${poly([[0, SCENE.h], [SCENE.w, SCENE.h], at(SCENE.w, SCENE.h, B), at(0, SCENE.h, B)], '')}</clipPath>`;
  svg += poly([[0, SCENE.h], [SCENE.w, SCENE.h], at(SCENE.w, SCENE.h, B), at(0, SCENE.h, B)], 'fill="#dfe3e7"');
  svg += '<g clip-path="url(#floor-clip)" stroke="#cbd0d6" stroke-width="2">';
  for (let x = -1600; x <= 3200; x += 200) {
    const [bx, by] = at(x, SCENE.h, B);
    svg += `<line x1="${x}" y1="${SCENE.h}" x2="${bx}" y2="${by}"/>`;
  }
  // Tile rows equally spaced on the ground, so their screen spacing shrinks with distance.
  for (let k = 0; ; k++) {
    const f = 1 / (1 + k * 0.17);
    if (f < B) break;
    const [lx, y] = at(0, SCENE.h, f);
    svg += `<line x1="${lx}" y1="${y}" x2="${SCENE.w - lx}" y2="${y}"/>`;
  }
  svg += '</g>';
  svg += flat(690, 910, 1, B, SCENE.h, 'fill="#b9c0c7"');    // granite border
  svg += flat(715, 885, 1, B, SCENE.h, 'fill="#41474e"');    // dark granite band
  return svg;
}

function pillar() {
  const f = 0.62;
  const [x1, top] = at(620, 0, f);
  const [x2, bottom] = at(980, SCENE.h, f);
  const w = x2 - x1;
  const p = { x: x1 + 18, y: top + 270, w: w - 36, h: bottom - top - 290 };
  return `
    <ellipse cx="800" cy="${bottom + 4}" rx="${w * 0.7}" ry="16" fill="rgba(0,0,0,0.16)"/>
    <rect x="${x1}" y="${top}" width="${w}" height="${bottom - top}" fill="#2e3238"/>
    <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="url(#poster)"/>
    <text x="${p.x + 18}" y="${p.y + 52}" font-size="40" font-weight="800" fill="#fff">METRO</text>
    <rect x="${p.x + 16}" y="${p.y + 200}" width="${p.w - 32}" height="12" fill="#3b2a1a"/>
    <rect x="${p.x + 40}" y="${p.y + 212}" width="12" height="${p.h - 240}" fill="#3b2a1a"/>
    <rect x="${p.x + p.w - 52}" y="${p.y + 212}" width="12" height="${p.h - 240}" fill="#3b2a1a"/>
    <g class="poster-train">
      <rect x="${p.x + 20}" y="${p.y + 150}" width="${p.w * 0.72}" height="50" rx="24" fill="#f8fafc"/>
      <rect x="${p.x + 36}" y="${p.y + 162}" width="${p.w * 0.6}" height="16" rx="6" fill="#2563eb"/>
    </g>
    <text x="${p.x + p.w - 18}" y="${p.y + p.h - 24}" font-size="28" font-weight="800" fill="#fff" text-anchor="end">${T.appName[state.lang].split(' ').pop()}</text>`;
}

// The hanging sign, in the chosen language: ← 2 towards the first station | towards the last station 1 →
function hangingSign(line) {
  const f = 0.86;
  const [x1, y1] = at(150, 120, f);
  const [x2, y2] = at(1450, 250, f);
  const mid = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const towards = id => T.towards[state.lang].replace('{x}', STATIONS[id][state.lang]);
  const first = LINES[line].stations[0];
  const last = LINES[line].stations[LINES[line].stations.length - 1];
  const box = (x, pf) => `
    <rect x="${x}" y="${cy - 34}" width="68" height="68" rx="10" fill="#fff"/>
    <text x="${x + 34}" y="${cy + 20}" font-size="52" font-weight="800" text-anchor="middle" fill="#1d4f91">${pf}</text>`;
  return `
    <line x1="${x1 + 120}" y1="0" x2="${x1 + 120}" y2="${y1}" stroke="#9aa3ad" stroke-width="6"/>
    <line x1="${x2 - 120}" y1="0" x2="${x2 - 120}" y2="${y1}" stroke="#9aa3ad" stroke-width="6"/>
    <rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="10" fill="#1d4f91"/>
    <line x1="${mid}" y1="${y1 + 12}" x2="${mid}" y2="${y2 - 12}" stroke="#fff" stroke-opacity="0.4" stroke-width="3"/>
    <text x="${x1 + 26}" y="${cy + 20}" font-size="58" font-weight="800" fill="#f5b301">←</text>
    ${box(x1 + 98, 2)}
    <text x="${x1 + 186}" y="${cy + 13}" font-size="34" font-weight="700" fill="#fff">${towards(first)}</text>
    <text x="${x2 - 186}" y="${cy + 13}" font-size="34" font-weight="700" fill="#fff" text-anchor="end">${towards(last)}</text>
    ${box(x2 - 166, 1)}
    <text x="${x2 - 26}" y="${cy + 20}" font-size="58" font-weight="800" fill="#f5b301" text-anchor="end">→</text>`;
}

/* ---------- the footstep trails ---------- */

function trailSVG(pf, active) {
  const steps = footsteps(TRAILS[pf]);
  const fill = PLATFORMS[pf].color;
  const edge = pf === 2 ? '#2b3036' : 'rgba(255,255,255,0.6)';
  const prints = steps.map((st, i) => `
    <g transform="translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) scale(${st.size.toFixed(2)} ${(st.size * st.squash).toFixed(2)}) rotate(${st.heading.toFixed(1)}) scale(${st.side} 1)">
      <g class="fp-glow" style="animation-delay:${(i * 0.14).toFixed(2)}s" fill="${GLOW[pf]}" filter="url(#fp-blur)"><g transform="scale(1.35)">${FOOT}</g></g>
      <g fill="${fill}" stroke="${edge}" stroke-width="0.05">${FOOT}</g>
    </g>`).join('');
  return `<g class="trail ${active ? 'trail-on' : 'trail-off'}">${prints}</g>`;
}

function platformPin(pf, active) {
  const ring = pf === 2 ? '#111827' : '#fff';
  return `
    <g class="${active ? 'pin-on' : 'pin-off'}">
      <g class="pf-pin" transform="translate(${STAIRS[pf].pin} ${OPENING.top - 64})">
        <circle r="40" fill="${PLATFORMS[pf].color}" stroke="${ring}" stroke-width="7"/>
        <text y="16" text-anchor="middle" font-size="46" font-weight="800" fill="${PLATFORMS[pf].ink}">${pf}</text>
        <path d="M-12 46 0 62 12 46z" fill="${ring}"/>
      </g>
    </g>`;
}

const WALKER = `<g id="walker" fill="#1f3a5f" stroke="#fff" stroke-width="1.6" stroke-linejoin="round">${PICTOGRAMS.walk}</g>`;

function sceneSVG(pf, line) {
  const other = pf === 1 ? 2 : 1;
  return `
    <svg viewBox="0 0 ${SCENE.w} ${SCENE.h}" preserveAspectRatio="xMidYMid slice" role="img"
         aria-label="${T.platform[state.lang]} ${pf}" font-family="Noto Sans, Noto Sans Gujarati, Noto Sans Devanagari, sans-serif">
      <defs>
        <filter id="fp-blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="0.12"/></filter>
        <linearGradient id="opening" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f99a4"/><stop offset="1" stop-color="#c8cfd6"/></linearGradient>
        <linearGradient id="poster" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7a23b"/><stop offset="1" stop-color="#e8541f"/></linearGradient>
      </defs>
      ${ceiling()}
      ${sideWalls()}
      ${backWall()}
      ${floor()}
      ${trailSVG(other, false)}
      ${trailSVG(pf, true)}
      ${pillar()}
      ${platformPin(other, false)}
      ${platformPin(pf, true)}
      ${WALKER}
      ${hangingSign(line)}
    </svg>`;
}

/* ---------- show / hide ---------- */

let walkerFrame = 0;

// A passenger figure walks the glowing trail to the stairs, again and again.
function walkTrail(tr) {
  cancelAnimationFrame(walkerFrame);
  const start = performance.now();
  const walk = 7500, pause = 1200;
  const frame = now => {
    const g = document.getElementById('walker');
    if (!g) return;
    const t = Math.min(1, ((now - start) % (walk + pause)) / walk);
    const [x, y] = bezier(tr, t);
    const [ahead] = bezier(tr, Math.min(1, t + 0.01));
    const size = (330 * depth(y)) / 48;           // a person is about a third of the hall's height
    const face = ahead < x ? -1 : 1;
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(size * face).toFixed(3)} ${size.toFixed(3)}) translate(-24 -47)`);
    g.style.opacity = t < 0.05 ? t / 0.05 : t > 0.9 ? Math.max(0, (1 - t) / 0.1) : 1;
    walkerFrame = requestAnimationFrame(frame);
  };
  walkerFrame = requestAnimationFrame(frame);
}

function showStationGuide(pf, line) {
  const el = document.getElementById('station-guide');
  el.innerHTML = sceneSVG(pf, line) +
    `<div class="guide-caption">${pictogram(KIOSK_STATION, 30)}<b>${stationName(KIOSK_STATION)}</b></div>`;
  el.hidden = false;
  walkTrail(TRAILS[pf]);
}

function hideStationGuide() {
  cancelAnimationFrame(walkerFrame);
  const el = document.getElementById('station-guide');
  el.hidden = true;
  el.innerHTML = '';
}
