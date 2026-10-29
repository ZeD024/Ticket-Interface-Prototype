/* Kiosk flow: language → greeting → destination → nearby stations → trip & tickets → payment. */

const state = {
  lang: 'en',
  screen: 'lang',
  place: null,        // { name: {en,gu,hi}, lat, lng, icon } when the user spoke a place
  suggestions: [],    // nearby station ids for state.place, best road trip first
  lastMiles: {},      // station id -> road route from that station to state.place
  trip: null,
  tickets: 1,
  cashIn: 0,          // cash received so far on the payment screen
  paidBy: null        // 'upi' | 'cash', detected from whichever arrives first
};

const panel = document.getElementById('panel');
const t = key => T[key][state.lang];
const stationName = id => STATIONS[id][state.lang];

/* ---------- helpers ---------- */

function haversine(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function bearing(a, b) {
  const rad = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * rad) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lng - a.lng) * rad);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

function fmtDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} ${t('km')}` : `${Math.round(m / 10) * 10} ${t('m')}`;
}

// Exit gate faces the way out: north = 1, east = 2, south = 3, west = 4. With a road
// route it follows the road leaving the station, otherwise the straight line to the place.
function exitGate(stationId, place, path) {
  if (!place) return 1;
  const s = STATIONS[stationId];
  let toward = place;
  if (path) {
    const p = path.find(([lat, lng]) => haversine(s, { lat, lng }) > 120);
    if (p) toward = { lat: p[0], lng: p[1] };
  }
  return 1 + Math.round(bearing(s, toward) / 90) % 4;
}

// Last stretch from the exit to the place: walk up to 2 km of road, otherwise auto/cab.
function makeLastMile(roadMeters, carSeconds, path = null) {
  const walk = roadMeters <= 2000;
  return {
    mode: walk ? 'walk' : 'cab',
    dist: roadMeters,
    // Router car times assume empty roads; city autos are slower and need a minute or three to find.
    mins: walk ? Math.max(1, Math.ceil(roadMeters / 75)) : Math.ceil((carSeconds / 60) * 1.7) + 3,
    path
  };
}

// Offline fallback when the road router can't be reached.
function estimateLastMile(stationId, place) {
  const road = haversine(STATIONS[stationId], place) * 1.3;
  return { ...makeLastMile(road, road / 9), estimated: true };
}

function nearestByAir(place, n) {
  return Object.keys(STATIONS)
    .filter(id => id !== KIOSK_STATION)
    .map(id => ({ id, d: haversine(place, STATIONS[id]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(x => x.id);
}

/* ---------- road routing (OSRM on OpenStreetMap data) ---------- */

const ROUTER = 'https://routing.openstreetmap.de/routed-car';

async function routerGet(path, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(ROUTER + path, { signal: ctrl.signal });
    const data = await res.json();
    return data.code === 'Ok' ? data : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const lngLat = p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`;

// Road distance and drive time from each station to the place, in one request.
async function roadTable(place, ids) {
  const coords = [place, ...ids.map(id => STATIONS[id])].map(lngLat).join(';');
  const data = await routerGet(`/table/v1/driving/${coords}?sources=${ids.map((_, i) => i + 1).join(';')}` +
    '&destinations=0&annotations=duration,distance');
  if (!data) return null;
  const out = {};
  ids.forEach((id, i) => {
    const dist = data.distances[i][0], secs = data.durations[i][0];
    if (dist != null && secs != null) out[id] = makeLastMile(dist, secs);
  });
  return out;
}

// The actual road path from a station to the place, as [lat, lng] points.
async function roadPath(stationId, place) {
  const data = await routerGet(`/route/v1/driving/${lngLat(STATIONS[stationId])};${lngLat(place)}?overview=full&geometries=geojson`);
  return data ? data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]) : null;
}

// Pick the stations with the shortest road trip to the place, not the shortest straight line.
async function suggestStations(place, n = 3) {
  const candidates = nearestByAir(place, 8);
  const table = await roadTable(place, candidates);
  const miles = {};
  for (const id of candidates) miles[id] = (table && table[id]) || estimateLastMile(id, place);
  // Shortest road distance first; within 100 m of each other, the quicker ride wins.
  const best = candidates
    .sort((a, b) => (Math.round(miles[a].dist / 100) - Math.round(miles[b].dist / 100)) || (miles[a].mins - miles[b].mins))
    .slice(0, n);
  const paths = await Promise.all(best.map(id => roadPath(id, place)));
  best.forEach((id, i) => { miles[id].path = paths[i]; });
  vlog('road ranking', best.map(id => `${id} ${(miles[id].dist / 1000).toFixed(1)} km`).join(', '));
  return { best, miles };
}

async function ensureLastMile(id) {
  const place = state.place;
  if (!place || (state.lastMiles[id] && state.lastMiles[id].path)) return;
  let lm = state.lastMiles[id];
  if (!lm) {
    const table = await roadTable(place, [id]);
    lm = (table && table[id]) || estimateLastMile(id, place);
  }
  lm.path = await roadPath(id, place);
  state.lastMiles[id] = lm;
}

function fareFor(stops) {
  if (stops <= 2) return 5;
  if (stops <= 5) return 10;
  if (stops <= 8) return 15;
  if (stops <= 12) return 20;
  return 25;
}

function segment(line, a, b) {
  const s = LINES[line].stations;
  const i = s.indexOf(a), j = s.indexOf(b);
  return i <= j ? s.slice(i, j + 1) : s.slice(j, i + 1).reverse();
}

// Each line has two platforms per station, one per direction; the interchange
// numbers the Red line's platforms 3 and 4.
function boardingPlatform(line, at, next) {
  const s = LINES[line].stations;
  let pf = s.indexOf(next) > s.indexOf(at) ? 1 : 2;
  if (STATIONS[at].interchange && line === 'red') pf += 2;
  return pf;
}

function planTrip(to, place) {
  // Asking for a station by name needs no walk at the end.
  if (place && place.stationId === to) place = null;
  const from = KIOSK_STATION;
  const fromLines = MetroMap.linesOf(from), toLines = MetroMap.linesOf(to);
  const common = fromLines.find(l => toLines.includes(l));
  let legs;
  if (common) {
    legs = [{ line: common, ids: segment(common, from, to) }];
  } else {
    const a = fromLines[0], b = toLines[0];
    const x = LINES[a].stations.find(s => LINES[b].stations.includes(s));
    legs = [{ line: a, ids: segment(a, from, x) }, { line: b, ids: segment(b, x, to) }];
  }
  legs.forEach(l => { l.platform = boardingPlatform(l.line, l.ids[0], l.ids[1]); });
  const stops = legs.reduce((n, l) => n + l.ids.length - 1, 0);
  const wait = 2 + (new Date().getMinutes() % 6);
  const metroMins = stops * 2 + (legs.length > 1 ? 5 : 0);
  const lm = place ? (state.lastMiles[to] || estimateLastMile(to, place)) : null;
  return {
    to, place, legs, stops, wait, metroMins,
    lastMile: lm,
    gate: exitGate(to, place, lm && lm.path),
    totalMins: wait + metroMins + (lm ? lm.mins : 0),
    fare: fareFor(stops)
  };
}

// Break an amount into Indian notes and coins, largest first.
function moneyPieces(amount) {
  const out = [];
  for (const d of [500, 200, 100, 50, 20, 10, 5, 2, 1]) {
    while (amount >= d) { out.push(d); amount -= d; }
  }
  return out;
}

function moneyHTML(amount, extraCls = '') {
  return moneyPieces(amount).map(d => d >= 10
    ? `<span class="note n${d} ${extraCls}" data-v="${d}"><span>₹${d}</span></span>`
    : `<span class="coin c${d} ${extraCls}" data-v="${d}"><span>₹${d}</span></span>`).join('');
}

function picHTML(obj, cls = '') {
  return obj.photo
    ? `<span class="pic ${cls}"><img src="${obj.photo}" alt=""></span>`
    : `<span class="pic ${cls}"><span class="pic-emoji">${obj.icon || '📍'}</span></span>`;
}

function feetSVG() {
  return `<svg class="feet" viewBox="0 0 24 24" aria-hidden="true">
    <ellipse cx="7" cy="16" rx="3.1" ry="4.9"/><circle cx="4.9" cy="9.3" r="1.1"/><circle cx="7.2" cy="8.6" r="1.15"/><circle cx="9.4" cy="9.4" r="1"/>
    <ellipse cx="16.8" cy="9.8" rx="3.1" ry="4.9"/><circle cx="14.6" cy="3.2" r="1"/><circle cx="16.8" cy="2.4" r="1.15"/><circle cx="19" cy="3.1" r="1.1"/>
  </svg>`;
}

function platformBadge(pf) {
  const p = PLATFORMS[pf];
  return `<span class="pf-badge" style="--pf:${p.color};--pf-ink:${p.ink}">
    ${feetSVG()}<span class="pf-text"><small>${t('platform')}</small><b>${pf}</b></span>
  </span>`;
}

function lineDot(line) {
  return `<span class="line-dot" style="background:${LINES[line].color}"></span>`;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- speech out ---------- */

let voices = [];
function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
if (window.speechSynthesis) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(code) {
  const norm = v => v.lang.toLowerCase().replace('_', '-');
  const want = { gu: 'gu', hi: 'hi', en: 'en-in' }[code];
  return voices.find(v => norm(v).startsWith(want)) ||
    (code === 'en' ? voices.find(v => norm(v).startsWith('en')) : null);
}

// Calls done() when speech ends, or straight away if no voice exists for this language.
function speak(text, done = () => {}) {
  const voice = window.speechSynthesis && pickVoice(state.lang);
  if (!voice) { setTimeout(done, 400); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.9;
  let finished = false;
  const finish = () => { if (!finished) { finished = true; done(); } };
  u.onend = finish;
  u.onerror = finish;
  // Some browsers never fire onend; don't let the flow hang on it.
  setTimeout(finish, Math.min(9000, 1500 + text.length * 90));
  speechSynthesis.speak(u);
}

// Recorded prompts live in audio/<lang>/<clip>.mp3 (made by tools/make_voices.py).
// If a clip is missing, fall back to the browser's own voice for that language.
const CLIP_TEXT = { greet: ['greet', 'greetSub'], whereTo: ['whereTo'], notFound: ['notFound'] };
let clipAudio = null;

function say(clip, done = () => {}) {
  stopSpeaking();
  const audio = new Audio(`audio/${state.lang}/${clip}.mp3`);
  clipAudio = audio;
  let finished = false;
  const finish = () => { if (!finished) { finished = true; done(); } };
  const fallback = () => {
    if (clipAudio !== audio) return;
    clipAudio = null;
    speak(CLIP_TEXT[clip].map(t).join(' '), finish);
  };
  audio.onended = finish;
  audio.onerror = fallback;
  // Never let a stalled clip hold up the flow.
  audio.onloadedmetadata = () => later(() => { if (clipAudio === audio) finish(); }, audio.duration * 1000 + 1500);
  later(() => { if (clipAudio === audio) finish(); }, 10000);
  audio.play().catch(fallback);
}

function stopSpeaking() {
  if (clipAudio) {
    clipAudio.onended = clipAudio.onerror = null;
    clipAudio.pause();
    clipAudio = null;
  }
  window.speechSynthesis && speechSynthesis.cancel();
}

/* ---------- speech in ---------- */

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
const vlog = (...args) => console.info('[voice]', ...args);

function setVoice(mode, text = '') {
  const box = panel.querySelector('.voice-box');
  if (!box) return;
  box.className = 'voice-box v-' + mode + (meter ? ' live' : '');
  const status = box.querySelector('.voice-status');
  const said = box.querySelector('.voice-said');
  status.textContent = {
    speaking: t('speaking'),
    listening: t('listening'),
    searching: t('searching'),
    idle: t('tapToSpeak'),
    notfound: t('notFound'),
    nomic: t('noMic'),
    blocked: t('micBlocked'),
    nodevice: t('noMicDevice'),
    network: t('voiceNet')
  }[mode];
  said.textContent = text ? `“${text}”` : '';
}

function listen() {
  if (!Recognition) { setVoice('nomic'); return; }
  stopListening();
  rec = new Recognition();
  rec.lang = LANGS.find(l => l.code === state.lang).speech;
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  let gotFinal = false;
  rec.onaudiostart = () => vlog('audio capture started', rec && rec.lang);
  rec.onspeechstart = () => vlog('speech detected');
  rec.onresult = e => {
    const res = e.results[e.results.length - 1];
    vlog(res.isFinal ? 'final' : 'interim', res[0].transcript);
    if (res.isFinal) {
      gotFinal = true;
      handleSpoken([...res].map(a => a.transcript));
    } else {
      setVoice('listening', res[0].transcript);
    }
  };
  rec.onerror = e => {
    vlog('error', e.error, e.message || '');
    const mode = {
      'not-allowed': 'blocked',
      'service-not-allowed': 'blocked',
      'audio-capture': 'nodevice',
      'network': 'network'
    }[e.error];
    if (mode) { stopMeter(); setVoice(mode); }
  };
  rec.onend = () => {
    vlog('recognition ended');
    stopMeter();
    const box = panel.querySelector('.voice-box');
    if (!gotFinal && box && box.classList.contains('v-listening')) setVoice('idle');
  };
  try {
    rec.start();
    setVoice('listening');
    startMeter();
  } catch (err) {
    vlog('start failed', err);
    setVoice('idle');
  }
}

function stopListening() {
  stopMeter();
  if (rec) {
    rec.onend = null;
    rec.onresult = null;
    rec.onerror = null;
    try { rec.abort(); } catch (e) { /* already stopped */ }
    rec = null;
  }
}

/* Live microphone level, drawn as bars around the mic button. It reads the mic
   separately from speech recognition, so it shows whether any sound reaches the kiosk. */

const RING_BARS = 28;
let meter = null;

async function startMeter() {
  stopMeter();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  const m = { stream: null, ctx: null, raf: 0, started: performance.now(), loudest: 0, warned: false };
  meter = m;
  try {
    m.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (meter !== m) { m.stream.getTracks().forEach(tr => tr.stop()); return; }
    vlog('meter using', m.stream.getAudioTracks()[0]?.label);
    m.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (m.ctx.state === 'suspended') await m.ctx.resume();
    const analyser = m.ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.55;
    m.ctx.createMediaStreamSource(m.stream).connect(analyser);
    const freq = new Uint8Array(analyser.frequencyBinCount);
    const wave = new Uint8Array(analyser.fftSize);
    panel.querySelector('.voice-box')?.classList.add('live');

    const tick = () => {
      if (meter !== m) return;
      analyser.getByteFrequencyData(freq);
      analyser.getByteTimeDomainData(wave);
      let peak = 0;
      for (const v of wave) peak = Math.max(peak, Math.abs(v - 128));
      const level = Math.min(1, peak / 64);
      m.loudest = Math.max(m.loudest, peak);
      const box = panel.querySelector('.voice-box');
      // A working mic always picks up some room noise; flat silence means the wrong or a muted mic.
      if (box && !m.warned && m.loudest <= 2 && performance.now() - m.started > 3000) {
        m.warned = true;
        vlog('microphone is silent:', m.stream.getAudioTracks()[0]?.label);
        box.querySelector('.voice-said').textContent = t('micSilent');
        box.classList.add('silent');
      }
      if (box) {
        box.style.setProperty('--lvl', level.toFixed(3));
        // Mirror the speech band (~90 Hz – 3.5 kHz) around both halves of the ring.
        const half = RING_BARS / 2;
        box.querySelectorAll('.mic-ring i').forEach((bar, i) => {
          const k = i < half ? i : RING_BARS - 1 - i;
          const bin = 1 + Math.round(k * 18 / half);
          bar.style.setProperty('--v', Math.min(1, (freq[bin] / 210) ** 1.6).toFixed(3));
        });
      }
      m.raf = requestAnimationFrame(tick);
    };
    tick();
  } catch (err) {
    vlog('meter unavailable', err.name);
    if (meter === m) meter = null;
  }
}

function stopMeter() {
  const m = meter;
  meter = null;
  if (!m) return;
  cancelAnimationFrame(m.raf);
  m.stream && m.stream.getTracks().forEach(tr => tr.stop());
  m.ctx && m.ctx.close();
  const box = panel.querySelector('.voice-box');
  if (box) {
    box.classList.remove('live');
    box.querySelectorAll('.mic-ring i').forEach(bar => bar.style.removeProperty('--v'));
  }
}

/* ---------- place matching ---------- */

const FILLERS = [
  'i want to go to', 'i want to go', 'i have to go to', 'take me to', 'go to', 'please', 'near',
  'મારે', 'જવું છે', 'જવું', 'જવાનું', 'છે', 'પાસે',
  'मुझे', 'जाना है', 'जाना', 'है', 'पास', 'तक'
];

function normText(s) {
  return s.toLowerCase().normalize('NFC').replace(/[.,!?'"()\-–—।:;]/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripFillers(s) {
  let out = ' ' + s + ' ';
  for (const f of [...FILLERS].sort((a, b) => b.length - a.length)) out = out.split(' ' + f + ' ').join(' ');
  return out.replace(/\s+/g, ' ').trim();
}

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

const ratio = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length);

function scoreName(text, name) {
  if (!text || !name) return 0;
  if (text === name) return 1;
  if (name.length >= 4 && text.includes(name)) return 0.95;
  if (text.length >= 4 && name.includes(text)) return 0.8 + 0.15 * (text.length / name.length);
  let best = ratio(text, name);
  const words = text.split(' ');
  const k0 = name.split(' ').length;
  for (let k = Math.max(1, k0 - 1); k <= k0 + 1; k++) {
    for (let i = 0; i + k <= words.length; i++) {
      best = Math.max(best, 0.97 * ratio(words.slice(i, i + k).join(' '), name));
    }
  }
  return best;
}

const CANDIDATES = [
  ...Object.entries(STATIONS).map(([id, s]) => ({ kind: 'station', id, item: s })),
  ...PLACES.map(p => ({ kind: 'place', item: p }))
].map(c => ({
  ...c,
  names: [c.item.en, c.item.gu, c.item.hi, ...(c.item.alias || [])].map(normText)
}));

function bestLocalMatch(alternatives) {
  let best = null;
  for (const alt of alternatives) {
    const text = stripFillers(normText(alt));
    if (!text) continue;
    for (const c of CANDIDATES) {
      for (const n of c.names) {
        const score = scoreName(text, n);
        if (!best || score > best.score) best = { ...c, score };
      }
    }
  }
  return best && best.score >= 0.7 ? best : null;
}

async function onlineSearch(text) {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&bounded=1' +
    '&viewbox=72.40,23.20,72.75,22.90&accept-language=' + state.lang + '&q=' + encodeURIComponent(text);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (!data.length) return null;
    // Prefer the result whose name is closest to what was said; if none is close,
    // show the user's own words rather than an unrelated shop or building name.
    const q = normText(text);
    const scored = data.map(r => ({ r, s: scoreName(q, normText(r.name || r.display_name.split(',')[0])) }))
      .sort((a, b) => b.s - a.s);
    const { r, s } = scored[0];
    const label = s >= 0.6 ? (r.name || r.display_name.split(',')[0]) : text.replace(/\b\w/g, c => c.toUpperCase());
    return { name: { en: label, gu: label, hi: label }, lat: +r.lat, lng: +r.lon, icon: '📍' };
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function handleSpoken(alternatives) {
  const heard = alternatives[0];
  setVoice('searching', heard);
  stopListening();
  const local = bestLocalMatch(alternatives);
  let place = null;
  if (local) {
    const it = local.item;
    place = { name: { en: it.en, gu: it.gu, hi: it.hi }, lat: it.lat, lng: it.lng, icon: it.icon, photo: it.photo, stationId: local.id };
  } else {
    place = await onlineSearch(stripFillers(normText(heard)) || heard);
  }
  if (state.screen !== 'dest') return;
  if (!place) {
    setVoice('notfound', heard);
    say('notFound', () => { if (state.screen === 'dest') listen(); });
    return;
  }
  choosePlace(place);
}

async function choosePlace(place) {
  state.place = place;
  const { best, miles } = await suggestStations(place);
  if (state.screen !== 'dest' || state.place !== place) return;
  state.suggestions = best;
  state.lastMiles = miles;
  go('pick');
}

// Used for demos without a microphone, e.g. demoSay('Kankaria')
window.demoSay = text => { if (state.screen === 'dest') handleSpoken([text]); };

/* ---------- screens ---------- */

function backBtn(target) {
  return `<button class="btn btn-back" data-go="${target}"><span class="btn-ico">←</span>${t('back')}</button>`;
}

const SCREENS = {
  lang() {
    return `
      <div class="screen screen-lang">
        <div class="lang-title">
          <span lang="gu">ભાષા પસંદ કરો</span>
          <span lang="hi">भाषा चुनें</span>
          <span lang="en">Choose your language</span>
        </div>
        <div class="lang-grid">
          ${LANGS.map((l, i) => `
            <button class="lang-btn" data-lang="${l.code}" style="--i:${i}">
              <span class="lang-sym" lang="${l.code}">${l.symbol}</span>
              <span class="lang-label" lang="${l.code}">${l.label}</span>
            </button>`).join('')}
        </div>
        <div class="tap-hint" aria-hidden="true"><span class="hand">👆</span></div>
      </div>`;
  },

  greet() {
    return `
      <div class="screen screen-greet">
        <div class="namaste" aria-hidden="true">🙏</div>
        <h1 class="greet-title">${t('greet')}</h1>
        <p class="greet-sub">${t('greetSub')}</p>
        <div class="sound-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      </div>`;
  },

  dest() {
    return `
      <div class="screen screen-dest">
        <h1 class="screen-title">${t('whereTo')}</h1>
        <div class="dest-visual" aria-hidden="true">
          <span class="dv-place">🏙️</span><span class="dv-q">?</span>
        </div>
        <div class="voice-box v-speaking">
          <div class="mic-ring">
            ${Array.from({ length: RING_BARS }, (_, i) =>
              `<i aria-hidden="true" style="--a:${i * (360 / RING_BARS)}deg;--d:${(-i * 0.09).toFixed(2)}s"></i>`).join('')}
            <button class="mic-btn" aria-label="${t('tapToSpeak')}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 1 0-7 0v6A3.5 3.5 0 0 0 12 15zm6.5-3.5a.9.9 0 1 0-1.8 0 4.7 4.7 0 0 1-9.4 0 .9.9 0 1 0-1.8 0 6.5 6.5 0 0 0 5.6 6.4V21h-2.4a.9.9 0 1 0 0 1.8h6.6a.9.9 0 1 0 0-1.8h-2.4v-3.1a6.5 6.5 0 0 0 5.6-6.4z"/></svg>
            </button>
          </div>
          <div class="voice-status">${t('speaking')}</div>
          <div class="voice-said"></div>
        </div>
        <div class="or-tap"><span class="hand-left" aria-hidden="true">👈</span><span>${t('orTap')}</span></div>
      </div>
      <div class="panel-foot">${backBtn('lang')}</div>`;
  },

  pick() {
    const p = state.place;
    return `
      <div class="screen screen-pick">
        <div class="place-chip">
          ${picHTML(p, 'pic-md')}
          <div class="place-chip-text"><span class="pin-dot">📍</span><b>${p.name[state.lang] || p.name.en}</b></div>
        </div>
        <h1 class="screen-title">${t('pickStation')}</h1>
        <div class="cards">
          ${state.suggestions.map((id, i) => {
            const lm = state.lastMiles[id];
            const walk = lm.mode === 'walk';
            const lines = MetroMap.linesOf(id);
            return `
              <button class="st-card" data-station="${id}" style="--i:${i}">
                <span class="card-num">${i + 1}</span>
                ${picHTML(STATIONS[id], 'pic-lg')}
                <span class="card-info">
                  <span class="card-name">${lines.map(lineDot).join('')}${stationName(id)}</span>
                  <span class="card-meta">
                    <span class="meta ${walk ? 'meta-walk' : 'meta-cab'}"><span class="meta-ico">${walk ? '🚶' : '🛺'}</span>${lm.mins} ${t('min')}</span>
                    <span class="meta meta-dist">${fmtDist(lm.dist)}</span>
                    <span class="exit-sign">EXIT <b>${exitGate(id, p, lm.path)}</b></span>
                  </span>
                </span>
                ${i === 0 ? '<span class="card-hand" aria-hidden="true">👆</span>' : ''}
              </button>`;
          }).join('')}
        </div>
      </div>
      <div class="panel-foot">${backBtn('dest')}</div>`;
  },

  trip() {
    const tr = state.trip;
    const destName = tr.place ? (tr.place.name[state.lang] || tr.place.name.en) : stationName(tr.to);
    const total = tr.fare * state.tickets;
    return `
      <div class="screen screen-trip">
        <div class="trip-head">
          <h1>${destName}</h1>
          <div class="trip-stats">
            <span class="stat"><span class="stat-ico">🚇</span><span class="stat-label">${t('nextTrain')}</span><b>${tr.wait} ${t('min')}</b></span>
            <span class="stat"><span class="stat-ico">⏱️</span><span class="stat-label">${t('totalTime')}</span><b>${tr.totalMins} ${t('min')}</b></span>
          </div>
        </div>

        ${flowHTML(tr)}

        <div class="fare-box">
          <div class="fare-q">${t('howMany')}</div>
          <div class="counter">
            <button class="count-btn" data-step="-1" aria-label="−" ${state.tickets <= 1 ? 'disabled' : ''}>−</button>
            <div class="count-mid">
              <span class="count-num">${state.tickets}</span>
              <span class="people" aria-hidden="true">${'<i>👤</i>'.repeat(state.tickets)}</span>
            </div>
            <button class="count-btn" data-step="1" aria-label="+" ${state.tickets >= 6 ? 'disabled' : ''}>+</button>
          </div>
          <div class="fare-calc">
            <span class="fare-each">👤 ₹${tr.fare} <small>${t('perPerson')}</small></span>
            <span class="money">${moneyHTML(total)}</span>
            <span class="fare-total">${t('total')} <b>₹${total}</b></span>
          </div>
        </div>
      </div>
      <div class="panel-foot">
        ${backBtn(state.place ? 'pick' : 'dest')}
        <button class="btn btn-go" data-go="pay">${t('pay')} ₹${total}<span class="btn-ico">→</span></button>
      </div>`;
  },

  // Both ways to pay are offered at once; whichever money arrives first decides the mode.
  pay() {
    const total = state.trip.fare * state.tickets;
    const cashStarted = state.cashIn > 0;
    return `
      <div class="screen screen-pay">
        <div class="pay-total">
          <span class="pay-people">${'<i>👤</i>'.repeat(state.tickets)}</span>
          <span class="pay-amount"><small>${t('pay')}</small>₹${total}</span>
        </div>
        <div class="pay-both ${cashStarted ? 'cash-started' : ''}">
          <div class="pay-col pay-upi">
            <div class="qr-wrap">${qrSVG(total)}</div>
            <div class="pay-cap"><span class="pay-cap-ico">📱</span>${t('scanQR')}</div>
          </div>
          <div class="pay-or"><span>${t('or')}</span></div>
          <div class="pay-col pay-cash">
            <div class="cash-anim" aria-hidden="true">
              <span class="ca-note"><span>₹</span></span>
              <span class="ca-hand">🫳</span>
              <span class="ca-machine"><span class="ca-slot"></span><span class="ca-arrow">⬇</span></span>
            </div>
            <div class="pay-cap"><span class="pay-cap-ico">💵</span>${t('insertCash')}</div>
          </div>
        </div>
        <div class="pay-status">
          ${cashStarted
            ? `<span class="cp-text">${t('received')} <b>₹${state.cashIn}</b> / ₹${total}</span>
               <span class="cp-bar"><i style="width:${Math.min(100, (state.cashIn / total) * 100)}%"></i></span>`
            : `<span class="spinner"></span>${t('waiting')}`}
        </div>
      </div>
      <div class="panel-foot">${backBtn('trip')}</div>`;
  },

  paid() {
    const total = state.trip.fare * state.tickets;
    return `
      <div class="screen screen-paid">
        <div class="tick" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg></div>
        <h1 class="screen-title">${t('paid')}</h1>
        <div class="paid-by">${state.paidBy === 'cash' ? `💵 ${t('paidCash')}` : `📱 ${t('paidUpi')}`} · ₹${total}</div>
        <div class="printing"><span class="printer">🖨️</span><span>${t('printing')}</span></div>
        <div class="print-bar"><i></i></div>
      </div>
      <div class="panel-foot"><button class="btn btn-go" data-go="lang">${t('done')}<span class="btn-ico">✓</span></button></div>`;
  }
};

// Route as a left-to-right flow: the start, interchange and destination as landmark
// pictures joined by arrows, with the stops in between drawn as dots.
function flowHTML(tr) {
  const lm = tr.lastMile;
  const nodeCount = tr.legs.length + 1 + (lm ? 1 : 0);
  const maxDots = { 2: 12, 3: 7, 4: 4 }[nodeCount] || 3;

  const node = (role, obj, name, chip, badge = '') => `
    <div class="fnode role-${role}">
      <span class="fchip">${chip}</span>
      ${picHTML(obj, 'pic-flow')}
      <span class="fname">${name}</span>
      ${badge}
    </div>`;

  const ride = leg => {
    const between = leg.ids.length - 2;
    const shown = Math.min(between, maxDots);
    return `
      <div class="fconn" style="--c:${LINES[leg.line].color}">
        <span class="fline">${'<i></i>'.repeat(shown)}${between > shown ? '<em>+' + (between - shown) + '</em>' : ''}</span>
        <span class="fcap"><span class="line-tag" style="background:${LINES[leg.line].color}">🚇 ${leg.ids.length - 1}</span><small>${t(leg.ids.length === 2 ? 'stop' : 'stops')}</small></span>
      </div>`;
  };

  let html = node('start', STATIONS[KIOSK_STATION], stationName(KIOSK_STATION), t('youAreHere'), platformBadge(tr.legs[0].platform));
  tr.legs.forEach((leg, i) => {
    html += ride(leg);
    const next = tr.legs[i + 1];
    if (next) {
      const at = next.ids[0];
      html += node('change', STATIONS[at], stationName(at), `⇄ ${t('change')}`, platformBadge(next.platform));
    }
  });
  html += node('dest', STATIONS[tr.to], stationName(tr.to), t('getOff'), `<span class="exit-sign">EXIT <b>${tr.gate}</b></span>`);
  if (lm) {
    const walk = lm.mode === 'walk';
    html += `
      <div class="fconn fconn-${lm.mode}">
        <span class="fline"></span>
        <span class="fcap"><span class="meta ${walk ? 'meta-walk' : 'meta-cab'}"><span class="meta-ico">${walk ? '🚶' : '🛺'}</span>${lm.mins}</span><small>${t('min')}</small></span>
      </div>`;
    html += node('place', tr.place, tr.place.name[state.lang] || tr.place.name.en, '📍', `<span class="fdist">${fmtDist(lm.dist)}</span>`);
  }
  return `<div class="flow flow-${nodeCount}">${html}</div>`;
}

// Simulated payment hardware: a UPI confirmation, or the next note/coin dropping into the slot.
function receive(mode) {
  if (state.screen !== 'pay' || state.paidBy) return;
  const total = state.trip.fare * state.tickets;
  if (mode === 'upi') {
    if (state.cashIn > 0) return;
    state.paidBy = 'upi';
    go('paid');
    return;
  }
  state.cashIn += moneyPieces(total - state.cashIn)[0];
  panel.innerHTML = SCREENS.pay();
  if (state.cashIn >= total) {
    state.paidBy = 'cash';
    later(() => go('paid'), 900);
  }
}

function qrSVG(amount) {
  if (typeof qrcode === 'undefined') return '<span class="qr-fallback">QR</span>';
  const data = `upi://pay?pa=ahmedabadmetro@upi&pn=Ahmedabad%20Metro&am=${amount}&cu=INR`;
  const qr = qrcode(0, 'M');
  qr.addData(data);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

/* ---------- navigation ---------- */

let timers = [];
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

function go(screen) {
  clearTimers();
  stopListening();
  stopSpeaking();
  if (screen === 'lang') resetState();
  if (screen === 'pay') Object.assign(state, { cashIn: 0, paidBy: null });
  state.screen = screen;
  panel.innerHTML = SCREENS[screen]();
  panel.dataset.screen = screen;
  panel.scrollTop = 0;
  document.body.dataset.screen = screen;
  updateHeader();
  enter(screen);
}

function resetState() {
  Object.assign(state, { place: null, suggestions: [], lastMiles: {}, trip: null, tickets: 1, cashIn: 0, paidBy: null });
}

function enter(screen) {
  MetroMap.setInteractive(screen === 'dest' || screen === 'pick');
  if (screen === 'lang' || screen === 'greet') {
    MetroMap.showNetwork();
  }
  if (screen === 'greet') {
    const started = Date.now();
    say('greet', () => {
      if (state.screen === 'greet') later(() => go('dest'), Math.max(300, 2200 - (Date.now() - started)));
    });
  }
  if (screen === 'dest') {
    MetroMap.showNetwork();
    say('whereTo', () => { if (state.screen === 'dest') listen(); });
  }
  if (screen === 'pick') {
    MetroMap.showSuggestions(state.place, state.suggestions, state.lastMiles);
  }
  if (screen === 'trip') {
    MetroMap.showRoute(state.trip);
  }
  if (screen === 'paid') {
    later(() => go('lang'), 15000);
  }
}

async function chooseStation(id) {
  if (id === KIOSK_STATION) { toast(t('alreadyHere')); return; }
  if (state.screen === 'dest') state.place = null;
  // A station tapped on the map that wasn't suggested still needs its road route.
  const from = state.screen;
  await ensureLastMile(id);
  if (state.screen !== from) return;
  state.tickets = 1;
  state.trip = planTrip(id, state.place);
  go('trip');
}

function updateHeader() {
  document.getElementById('brand-name').textContent = state.screen === 'lang' ? T.appName.en : t('appName');
  const lang = LANGS.find(l => l.code === state.lang);
  document.querySelector('#btn-lang .chip-sym').textContent =
    state.screen === 'lang' ? 'અ अ Aa' : `${lang.symbol}  ${lang.label}`;
  renderLegend();
}

function renderLegend() {
  const lang = state.screen === 'lang' ? 'en' : state.lang;
  document.getElementById('map-legend').innerHTML = `
    ${Object.values(LINES).map(l => `<span class="lg-item"><span class="lg-line" style="background:${l.color}"></span>${l.name[lang]}</span>`).join('')}
    <span class="lg-item"><span class="lg-here"></span>${T.youAreHere[lang]}</span>`;
}

/* ---------- events ---------- */

panel.addEventListener('click', e => {
  const el = e.target.closest('button, .qr-wrap, .cash-anim');
  if (!el) return;

  if (el.dataset.lang) {
    state.lang = el.dataset.lang;
    document.documentElement.lang = state.lang;
    MetroMap.setLang(state.lang);
    el.classList.add('chosen');
    later(() => go('greet'), 250);
    return;
  }
  if (el.dataset.go) { go(el.dataset.go); return; }
  if (el.classList.contains('mic-btn')) { stopSpeaking(); listen(); return; }
  if (el.dataset.station) { chooseStation(el.dataset.station); return; }
  if (el.dataset.step) {
    state.tickets = Math.min(6, Math.max(1, state.tickets + +el.dataset.step));
    const scroll = panel.scrollTop;
    panel.innerHTML = SCREENS.trip();
    panel.scrollTop = scroll;
    return;
  }
  // Demo stand-ins for the payment hardware: tap the QR = UPI received, tap the slot = cash inserted.
  if (el.classList.contains('qr-wrap')) { receive('upi'); return; }
  if (el.classList.contains('cash-anim')) { receive('cash'); }
});

// Presenter shortcuts on the payment screen: U = UPI payment arrives, C = insert the next note.
document.addEventListener('keydown', e => {
  if (state.screen !== 'pay') return;
  if (e.key === 'u' || e.key === 'U') receive('upi');
  if (e.key === 'c' || e.key === 'C') receive('cash');
});

document.getElementById('btn-home').addEventListener('click', () => go('lang'));
document.getElementById('btn-lang').addEventListener('click', () => go('lang'));

// Return to the start after 90 s without a touch.
let idleTimer;
function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (state.screen !== 'lang') go('lang'); }, 90000);
}
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, resetIdle));

window.addEventListener('resize', () => MetroMap.invalidate());

MetroMap.init(id => {
  if (state.screen === 'dest' || state.screen === 'pick') chooseStation(id);
  else if (state.screen === 'lang') document.querySelector('.lang-grid')?.classList.add('nudge');
});
go('lang');
resetIdle();
