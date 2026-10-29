/* Map half of the kiosk: street map with the metro network drawn on top. */

const MetroMap = (() => {
  let map;
  let lang = 'en';
  let onTap = () => {};
  const markers = {};      // station id -> L.marker
  const lineLayers = {};   // line id -> [casing, line]
  const overlay = L.layerGroup();
  let view = { mode: 'network', numbered: {}, route: new Set(), dest: null, change: null };

  const ALL_BOUNDS = () => L.latLngBounds(Object.values(STATIONS).map(s => [s.lat, s.lng]));

  function linesOf(id) {
    return Object.keys(LINES).filter(l => LINES[l].stations.includes(id));
  }

  function init(tapHandler) {
    onTap = tapHandler;
    map = L.map('map', {
      zoomControl: false,
      zoomSnap: 0.25,
      attributionControl: true,
      minZoom: 11,
      maxZoom: 17
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'base-tiles',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    for (const [id, line] of Object.entries(LINES)) {
      const pts = line.stations.map(s => [STATIONS[s].lat, STATIONS[s].lng]);
      const casing = L.polyline(pts, { color: '#fff', weight: 12, opacity: 0.9, interactive: false }).addTo(map);
      const stroke = L.polyline(pts, { color: line.color, weight: 7, opacity: 0.95, interactive: false }).addTo(map);
      lineLayers[id] = [casing, stroke];
    }

    for (const id of Object.keys(STATIONS)) {
      const s = STATIONS[id];
      const m = L.marker([s.lat, s.lng], { icon: buildIcon(id), keyboard: false });
      m.on('click', () => onTap(id));
      m.addTo(map);
      markers[id] = m;
    }

    overlay.addTo(map);
    map.on('zoomend moveend', declutter);
    map.on('zoomend', () => {
      document.getElementById('map').classList.toggle('far', map.getZoom() < 12.75);
    });
    fitAll(false);
    document.fonts && document.fonts.ready.then(declutter);
  }

  function buildIcon(id) {
    const s = STATIONS[id];
    const lines = linesOf(id);
    const cls = ['st'];
    cls.push(lines.length > 1 ? 'line-both' : 'line-' + lines[0]);
    if (id === KIOSK_STATION) cls.push('is-origin');
    if (s.interchange) cls.push('is-interchange');
    if (view.numbered[id]) cls.push('is-hl');
    if (view.route.has(id)) cls.push('is-route');
    if (view.dest === id) cls.push('is-dest');
    if (view.change === id) cls.push('is-change');
    const dimmed = (view.mode === 'suggest' && !view.numbered[id] && id !== KIOSK_STATION) ||
                   (view.mode === 'route' && !view.route.has(id));
    if (dimmed) cls.push('is-dim');

    const pic = s.photo
      ? `<img src="${s.photo}" alt="">`
      : `<span class="st-emoji">${s.icon}</span>`;
    const num = view.numbered[id] ? `<span class="st-num">${view.numbered[id]}</span>` : '';
    const here = id === KIOSK_STATION ? `<span class="st-here">${T.youAreHere[lang]}</span>` : '';
    const html = `<div class="${cls.join(' ')}">${here}<div class="st-pic">${pic}${num}</div><div class="st-name">${s[lang]}</div></div>`;
    return L.divIcon({ className: 'st-icon', html, iconSize: [0, 0] });
  }

  function refresh() {
    for (const id of Object.keys(markers)) {
      markers[id].setIcon(buildIcon(id));
      const top = id === KIOSK_STATION || view.numbered[id] || view.dest === id || view.change === id;
      markers[id].setZIndexOffset(top ? 1000 : 0);
    }
    requestAnimationFrame(declutter);
  }

  // Hide station names that would overlap a more important one.
  function declutter() {
    const prio = id => (view.numbered[id] || view.dest === id ? 100 : 0) + (id === KIOSK_STATION ? 100 : 0) +
      (view.change === id ? 80 : 0) + (view.route.has(id) ? 40 : 0) + (STATIONS[id].interchange ? 30 : 0) +
      (LINES.blue.stations[0] === id || LINES.red.stations[0] === id ||
       LINES.blue.stations.at(-1) === id || LINES.red.stations.at(-1) === id ? 10 : 0);
    const ids = Object.keys(markers).sort((a, b) => prio(b) - prio(a));
    const els = ids.map(id => [id, markers[id].getElement()]).filter(([, el]) => el);
    // Station pictures are always shown, so every label has to avoid all of them.
    const pics = els.map(([id, el]) => [id, el.querySelector('.st-pic').getBoundingClientRect()]);
    const overlaps = (r, p) => r.left < p.right && r.right > p.left && r.top < p.bottom && r.bottom > p.top;
    const placed = [];
    for (const [id, el] of els) {
      const name = el.querySelector('.st-name');
      name.classList.remove('hidden');
      const r = name.getBoundingClientRect();
      const hit = placed.some(p => overlaps(r, p)) || pics.some(([pid, p]) => pid !== id && overlaps(r, p));
      if (hit && prio(id) < 100) name.classList.add('hidden');
      else placed.push(r);
    }
  }

  function setLines(dim) {
    for (const [casing, stroke] of Object.values(lineLayers)) {
      casing.setStyle({ opacity: dim ? 0.4 : 0.9 });
      stroke.setStyle({ opacity: dim ? 0.25 : 0.95 });
    }
  }

  function fitAll(animate = true) {
    map.fitBounds(ALL_BOUNDS(), { padding: [40, 40], animate });
  }

  function placePin(place) {
    const html = `<div class="pin"><svg viewBox="0 0 24 34"><path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 34 12 34s12-13.2 12-22.1C24 5.3 18.6 0 12 0z"/><circle cx="12" cy="12" r="4.6"/></svg>` +
      `<span class="pin-label"><span class="pin-ico">${place.icon || '📍'}</span>${place.name[lang] || place.name.en}</span></div>`;
    return L.marker([place.lat, place.lng], {
      icon: L.divIcon({ className: 'pin-icon', html, iconSize: [0, 0] }),
      interactive: false,
      zIndexOffset: 2000
    });
  }

  function pill(latlng, html, cls = '') {
    return L.marker(latlng, {
      icon: L.divIcon({ className: 'pill-icon', html: `<span class="map-pill ${cls}">${html}</span>`, iconSize: [0, 0] }),
      interactive: false,
      zIndexOffset: 1500
    });
  }

  // A round arrow badge at the middle of a→b, rotated to point from a to b on screen.
  function arrow(a, b, color) {
    const dx = (b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180);
    const dy = -(b[0] - a[0]);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], {
      icon: L.divIcon({
        className: 'arrow-icon',
        html: `<span class="map-arrow" style="--c:${color};transform:translate(-50%,-50%) rotate(${angle}deg)"><svg viewBox="0 0 12 12"><path d="M4 2.2l4.2 3.8L4 9.8"/></svg></span>`,
        iconSize: [0, 0]
      }),
      interactive: false,
      zIndexOffset: 500
    });
  }

  function reset() {
    overlay.clearLayers();
    view = { mode: 'network', numbered: {}, route: new Set(), dest: null, change: null };
    setLines(false);
  }

  function showNetwork() {
    reset();
    refresh();
    fitAll();
  }

  function showSuggestions(place, stationIds) {
    reset();
    view.mode = 'suggest';
    stationIds.forEach((id, i) => { view.numbered[id] = i + 1; });
    setLines(true);
    for (const id of stationIds) {
      const s = STATIONS[id];
      L.polyline([[place.lat, place.lng], [s.lat, s.lng]], {
        color: '#5f6368', weight: 4, dashArray: '2 10', lineCap: 'round', interactive: false
      }).addTo(overlay);
    }
    placePin(place).addTo(overlay);
    refresh();
    const pts = [[place.lat, place.lng], ...stationIds.map(id => [STATIONS[id].lat, STATIONS[id].lng])];
    map.flyToBounds(L.latLngBounds(pts), { padding: [110, 110], maxZoom: 15.5, duration: 1.1 });
  }

  function showRoute(trip) {
    reset();
    view.mode = 'route';
    view.dest = trip.to;
    view.change = trip.legs.length > 1 ? trip.legs[1].ids[0] : null;
    trip.legs.forEach(l => l.ids.forEach(id => view.route.add(id)));
    view.route.add(KIOSK_STATION);
    setLines(true);

    const pts = [];
    for (const leg of trip.legs) {
      const latlngs = leg.ids.map(id => [STATIONS[id].lat, STATIONS[id].lng]);
      pts.push(...latlngs);
      L.polyline(latlngs, { color: '#fff', weight: 16, opacity: 1, interactive: false }).addTo(overlay);
      L.polyline(latlngs, { color: LINES[leg.line].color, weight: 10, opacity: 1, interactive: false, className: 'route-line' }).addTo(overlay);
      const midIdx = Math.floor((latlngs.length - 1) / 2);
      const mid = latlngs[midIdx];
      const next = latlngs[midIdx + 1] || mid;
      const at = [(mid[0] + next[0]) / 2, (mid[1] + next[1]) / 2];
      pill(at, `<span class="pill-ico">🚇</span>${leg.ids.length - 1} ${T[leg.ids.length === 2 ? 'stop' : 'stops'][lang]}`, 'pill-' + leg.line).addTo(overlay);
      // Direction-of-travel arrows on every other section between stations.
      for (let i = 0; i < latlngs.length - 1; i++) {
        if (i === midIdx) continue;
        arrow(latlngs[i], latlngs[i + 1], LINES[leg.line].color).addTo(overlay);
      }
    }

    if (trip.place && trip.lastMile) {
      const s = STATIONS[trip.to];
      const walk = trip.lastMile.mode === 'walk';
      L.polyline([[s.lat, s.lng], [trip.place.lat, trip.place.lng]], walk
        ? { color: '#1a73e8', weight: 7, dashArray: '0.1 14', lineCap: 'round', interactive: false }
        : { color: '#f29900', weight: 6, dashArray: '14 10', interactive: false }).addTo(overlay);
      placePin(trip.place).addTo(overlay);
      const at = [(s.lat + trip.place.lat) / 2, (s.lng + trip.place.lng) / 2];
      pill(at, `<span class="pill-ico">${walk ? '🚶' : '🛺'}</span>${trip.lastMile.mins} ${T.min[lang]}`, walk ? 'pill-walk' : 'pill-cab').addTo(overlay);
      pts.push([trip.place.lat, trip.place.lng]);
    }

    refresh();
    map.flyToBounds(L.latLngBounds(pts), { padding: [90, 90], maxZoom: 15, duration: 1.1 });
  }

  function setLang(code) {
    lang = code;
    refresh();
  }

  function setInteractive(on) {
    document.getElementById('map').classList.toggle('tappable', on);
  }

  function invalidate() {
    map && map.invalidateSize();
  }

  return { init, setLang, showNetwork, showSuggestions, showRoute, setInteractive, invalidate, refresh, linesOf };
})();
