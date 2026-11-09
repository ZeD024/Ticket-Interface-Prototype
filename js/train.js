/* Demo: the passenger information display inside a train, reached from the ticket preview.
   It is for everyone on board, not for one ticket: it shows the whole line the train
   runs on, drawn from the stations' real positions, a train moving along it, and a top
   band saying which station was just passed, which is next and where the train ends.
   Like the ticket, it is laid out in fixed pixels and scaled to fit. */

const PID = { w: 1280, h: 720, top: 168, bottom: 84 };
const PID_MAP = { x: 0, y: PID.top, w: PID.w, h: PID.h - PID.top - PID.bottom, padX: 110, padY: 96 };
const PID_TIMES = { travel: 1600, dwell: 900, change: 1800, start: 1200, end: 3500 };

const pid = { run: 0, line: 'blue', forward: true };

// The stations in the order this train calls at them.
function lineRun(line, forward) {
  const stops = forward ? [...LINES[line].stations] : [...LINES[line].stations].reverse();
  return { line, stops, last: stops.length - 1 };
}

// The other line serving a station, if it is an interchange.
const otherLine = (line, id) => Object.keys(LINES).find(l => l !== line && LINES[l].stations.includes(id));

// Fits a line into the wide map area from its stations' real coordinates. The line's
// real shape is turned so its two ends sit left and right (as on in-train displays),
// and like a metro diagram one direction may be stretched (up to 2×) to spread stations.
function projection(stops, line) {
  const k = Math.cos((STATIONS[stops[0]].lat * Math.PI) / 180);
  const geo = id => [STATIONS[id].lng * k, -STATIONS[id].lat];
  const ends = LINES[line].stations;
  const [ax, ay] = geo(ends[0]);
  const [bx, by] = geo(ends[ends.length - 1]);
  const turn = -Math.atan2(by - ay, bx - ax);
  const raw = id => {
    const [x, y] = geo(id);
    return [x * Math.cos(turn) - y * Math.sin(turn), x * Math.sin(turn) + y * Math.cos(turn)];
  };
  const xs = stops.map(id => raw(id)[0]);
  const ys = stops.map(id => raw(id)[1]);
  const span = v => Math.max(Math.max(...v) - Math.min(...v), 1e-6);
  const mid = v => (Math.max(...v) + Math.min(...v)) / 2;
  const fitX = (PID_MAP.w - 2 * PID_MAP.padX) / span(xs);
  const fitY = (PID_MAP.h - 2 * PID_MAP.padY) / span(ys);
  const s = Math.min(fitX, fitY);
  const sx = Math.min(fitX, s * 2);
  const sy = Math.min(fitY, s * 2);
  return id => {
    const [x, y] = raw(id);
    return [PID_MAP.x + PID_MAP.w / 2 + (x - mid(xs)) * sx, PID_MAP.y + PID_MAP.h / 2 + (y - mid(ys)) * sy];
  };
}

// Small station names: tilted along a mostly level line, beside a mostly upright one,
// alternating sides so neighbours don't collide.
function stationLabel(p, prev, next, i, name, last) {
  const dx = next[0] - prev[0];
  const dy = next[1] - prev[1];
  const above = i % 2 === 0 && !last;              // the last station's flag stands above it
  if (Math.abs(dx) > Math.abs(dy) * 1.2) {
    const [x, y] = above ? [p[0] + 8, p[1] - 22] : [p[0] - 8, p[1] + 30];
    return `<text class="pid-name" x="${x}" y="${y}" text-anchor="${above ? 'start' : 'end'}" transform="rotate(-36 ${x} ${y})">${name}</text>`;
  }
  const len = Math.hypot(dx, dy) || 1;
  const side = above ? -1 : 1;
  const nx = (-dy / len) * side;
  const ny = (dx / len) * side;
  const anchor = nx > 0.35 ? 'start' : nx < -0.35 ? 'end' : 'middle';
  return `<text class="pid-name" x="${p[0] + nx * 26}" y="${p[1] + ny * 26 + 5}" text-anchor="${anchor}">${name}</text>`;
}

function pidMap(run, at) {
  const L = state.lang;
  const color = LINES[run.line].color;
  const pts = run.stops.map(at);
  let svg = '';
  // Interchanges: a short stub of the other line, heading towards its neighbouring stations.
  run.stops.forEach((id, i) => {
    const other = otherLine(run.line, id);
    if (!other) return;
    const s = LINES[other].stations;
    const k = s.indexOf(id);
    [s[k - 1], s[k + 1]].filter(Boolean).forEach(nb => {
      const [x, y] = at(nb);
      const len = Math.hypot(x - pts[i][0], y - pts[i][1]) || 1;
      const reach = Math.min(70, len);
      svg += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[i][0] + ((x - pts[i][0]) / len) * reach}" y2="${pts[i][1] + ((y - pts[i][1]) / len) * reach}" stroke="${LINES[other].color}" stroke-width="8" stroke-linecap="round" opacity="0.75"/>`;
    });
  });
  // The line ahead is pale; the part already travelled is redrawn bright as the train moves.
  svg += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.32"/>`;
  svg += '<polyline id="pid-done" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>';
  pts.forEach((p, i) => {
    const id = run.stops[i];
    const role = i === run.last ? 'end' : otherLine(run.line, id) ? 'change' : 'stop';
    svg += `
      <g class="pid-stop pid-${role}" id="pid-stop-${i}">
        ${role === 'change' ? `<circle cx="${p[0]}" cy="${p[1]}" r="18" fill="none" stroke="#a78bfa" stroke-width="4"/>` : ''}
        <circle class="pid-dot" cx="${p[0]}" cy="${p[1]}" r="11" stroke="${color}" stroke-width="4"/>
        <text class="pid-num" x="${p[0]}" y="${p[1] + 4}" text-anchor="middle">${LINES[run.line].stations.indexOf(id) + 1}</text>
        ${stationLabel(p, pts[Math.max(0, i - 1)], pts[Math.min(run.last, i + 1)], i, STATIONS[id][L], i === run.last)}
        ${role === 'end' ? `<g transform="translate(${p[0] - 2} ${p[1] - 56})"><path d="M0 0v40" stroke="#fff" stroke-width="3"/><path d="M0 0h26l-6 8 6 8H0z" fill="#22c55e"/></g>` : ''}
      </g>`;
  });
  svg += `
    <g id="pid-train">
      <circle class="pid-pulse" r="26" fill="none" stroke="#fde047" stroke-width="4"/>
      <circle r="20" fill="#fde047"/>
      <g transform="translate(-13 -13) scale(0.54)" fill="#111827">${PICTOGRAMS.kalupur}</g>
    </g>`;
  return svg;
}

function pidTile(id, size) {
  return `<span class="pid-tile" style="width:${size}px;height:${size}px">${pictogram(id, Math.round(size * 0.74))}</span>`;
}

function pidSmall(label, id, line) {
  if (!id) return `<div class="pid-side"><small>${label}</small><div class="pid-side-row pid-empty">—</div></div>`;
  return `<div class="pid-side"><small>${label}</small>
    <div class="pid-side-row">${pidTile(id, 54)}<span><b>${STATIONS[id][state.lang]}</b><em>${LINES[line].stations.indexOf(id) + 1}</em></span></div></div>`;
}

// The top band: the station just passed, the big "next" (or "this station") and where the train ends.
function pidBand(run, ev) {
  const L = state.lang;
  const alt = L === 'en' ? 'gu' : 'en';
  const passedIdx = ev.type === 'move' ? ev.from : ev.at - 1;
  const bigIdx = ev.type === 'move' ? ev.from + 1 : ev.at;
  const big = run.stops[bigIdx];
  const other = otherLine(run.line, big);
  const atEnd = ev.type === 'dwell' && ev.at === run.last;
  let label = ev.type === 'move' ? T.nextStation[L] : T.thisStation[L];
  if (atEnd) label = T.lastStation[L];
  const change = other ? `<span class="pid-chip pid-xchip">⇄ ${T.changeFor[L]} <span style="background:${LINES[other].color}">${LINES[other].name[L]}</span></span>` : '';
  const togo = run.last - bigIdx;
  const left = togo === 0 ? '' : togo === 1 ? T.toGoOne[L] : T.toGo[L].replace('{n}', togo);
  return `
    <div class="pid-stripe" style="background:${LINES[run.line].color}"></div>
    ${pidSmall(T.justPassed[L], passedIdx >= 0 ? run.stops[passedIdx] : null, run.line)}
    <div class="pid-main ${ev.type === 'dwell' && (other || atEnd) ? 'pid-alert' : ''}">
      ${pidTile(big, 96)}
      <div>
        <small>${label}</small>
        <h2>${STATIONS[big][L]}<em>${LINES[run.line].stations.indexOf(big) + 1}</em></h2>
        <span class="pid-alt">${STATIONS[big][alt]}</span>${change}
      </div>
    </div>
    ${pidSmall(T.trainTo[L], run.stops[run.last], run.line)}
    <div class="pid-togo">${left}</div>`;
}

// The run as a list of moves and stops, with how long each lasts; it then starts again.
function pidPlan(run) {
  const plan = [{ type: 'dwell', at: 0, dur: PID_TIMES.start }];
  for (let i = 0; i < run.last; i++) {
    plan.push({ type: 'move', from: i, dur: PID_TIMES.travel });
    const next = i + 1;
    plan.push({
      type: 'dwell',
      at: next,
      dur: next === run.last ? PID_TIMES.end : otherLine(run.line, run.stops[next]) ? PID_TIMES.change : PID_TIMES.dwell
    });
  }
  return plan;
}

function playLine() {
  const token = ++pid.run;
  const run = lineRun(pid.line, pid.forward);
  const at = projection(run.stops, run.line);
  const pts = run.stops.map(at);
  const plan = pidPlan(run);
  const total = plan.reduce((sum, ev) => sum + ev.dur, 0);
  const svg = document.getElementById('pid-map');
  svg.innerHTML = pidMap(run, at);
  const band = document.getElementById('pid-band');
  const train = document.getElementById('pid-train');
  const done = document.getElementById('pid-done');
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const start = performance.now();
  let shown = -1;
  syncLineButtons();

  const frame = now => {
    if (token !== pid.run || !svg.isConnected) return;
    if (now - start >= total) { playLine(); return; }
    let t = now - start;
    let e = 0;
    while (t > plan[e].dur) { t -= plan[e].dur; e++; }
    const ev = plan[e];
    if (e !== shown) {
      shown = e;
      band.innerHTML = pidBand(run, ev);
      const reached = ev.type === 'move' ? ev.from : ev.at;
      run.stops.forEach((_, i) => {
        const el = document.getElementById(`pid-stop-${i}`);
        el.classList.toggle('passed', i <= reached);
        el.classList.toggle('next', ev.type === 'move' ? i === ev.from + 1 : i === ev.at);
      });
    }
    let x, y;
    if (ev.type === 'move') {
      const a = pts[ev.from], b = pts[ev.from + 1];
      const k = ease(Math.min(1, t / ev.dur));
      x = a[0] + (b[0] - a[0]) * k;
      y = a[1] + (b[1] - a[1]) * k;
    } else {
      [x, y] = pts[ev.at];
    }
    train.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    // Travelled part: every station passed so far, then the train's current spot.
    const travelled = pts.slice(0, (ev.type === 'move' ? ev.from : ev.at) + 1).concat([[x, y]]);
    done.setAttribute('points', travelled.map(p => p.join(',')).join(' '));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function syncLineButtons() {
  previewEl.querySelectorAll('[data-line]').forEach(b => b.classList.toggle('on', b.dataset.line === pid.line));
}

function openTrainDemo() {
  preview.run++;
  releaseTicketFiles();
  stopSpeaking();
  // Start on the line, and in the direction, of the trip just bought.
  const leg = state.trip && state.trip.legs[0];
  if (leg) {
    const s = LINES[leg.line].stations;
    pid.line = leg.line;
    pid.forward = s.indexOf(leg.ids[1]) > s.indexOf(leg.ids[0]);
  }
  previewEl.innerHTML = `
    <div class="dp-bar">Demo preview · the information display inside a train, for all passengers</div>
    <div class="dp-stage"><div class="dp-fit">
      <div class="pid" lang="${state.lang}">
        <div class="pid-band" id="pid-band"></div>
        <svg class="pid-map" id="pid-map" viewBox="0 0 ${PID.w} ${PID.h}" width="${PID.w}" height="${PID.h}"></svg>
      </div>
    </div></div>
    <div class="dp-actions">
      <button class="btn dp-exit" data-dp="tickets">← Tickets</button>
      ${Object.keys(LINES).map(l => `<button class="btn dp-exit dp-line" data-dp="line" data-line="${l}" style="--c:${LINES[l].color}">${LINES[l].name.en}</button>`).join('')}
      <button class="btn dp-exit" data-dp="flip">⇆ Direction</button>
      <button class="btn dp-exit" data-dp="exit">✕ Exit preview</button>
    </div>`;
  fitTicket();
  playLine();
}

previewEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-dp]');
  if (!btn) return;
  if (btn.dataset.dp === 'train') openTrainDemo();
  if (btn.dataset.dp === 'line') { pid.line = btn.dataset.line; pid.forward = true; playLine(); }
  if (btn.dataset.dp === 'flip') { pid.forward = !pid.forward; playLine(); }
  if (btn.dataset.dp === 'tickets') { pid.run++; openTicketPreview(); }
});
