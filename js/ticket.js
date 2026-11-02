/* The printed tickets, and the demo-only preview of them.
   Every passenger gets a separate ticket with its own QR. Tickets are pure black on
   white, like a thermal printer, and laid out in fixed pixels so the on-screen preview
   and the PDF come out identical. */

const TICKET_W = 1000;       // px, matches .ticket in style.css
const TICKET_STUB = 236;     // px, the QR stub on the right
const TICKET_PAD = 24;
const TICKET_NODE = 128;     // px, one station in the route flow
const TICKET_PDF_W = 200;    // mm
const TICKET_VALID_HOURS = 2;

function issueTickets() {
  const issued = new Date();
  const pad = n => String(n).padStart(2, '0');
  const stamp = `${String(issued.getFullYear()).slice(2)}${pad(issued.getMonth() + 1)}${pad(issued.getDate())}`;
  const first = 1000 + Math.floor(Math.random() * 8990);
  const valid = new Date(issued.getTime() + TICKET_VALID_HOURS * 3600 * 1000);
  return Array.from({ length: state.tickets }, (_, i) => ({
    no: `${stamp}-${first + i}`,
    issued,
    valid,
    index: i + 1,
    of: state.tickets,
    fare: state.trip.fare,
    paidBy: state.paidBy,
    lang: state.lang
  }));
}

function ticketQR(tk, trip) {
  const data = ['AMT1', tk.no, KIOSK_STATION, trip.to, `${tk.index}/${tk.of}`, tk.fare, tk.valid.toISOString()].join('|');
  const qr = qrcode(0, 'M');
  qr.addData(data);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

function tkConnector(w, kind, between = 0) {
  const y = 10;
  const shaft = w - 15;
  const line = {
    metro: `stroke="#000" stroke-width="8"`,
    walk: `stroke="#000" stroke-width="7" stroke-dasharray="0.1 12" stroke-linecap="round"`,
    cab: `stroke="#000" stroke-width="6" stroke-dasharray="13 8"`
  }[kind];
  const room = Math.floor((shaft - 16) / 13);
  const shown = Math.min(between, room);
  const dots = Array.from({ length: shown }, (_, i) =>
    `<circle cx="${(10 + ((shaft - 20) * (i + 0.5)) / shown).toFixed(1)}" cy="${y}" r="2.8" fill="#fff"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" viewBox="0 0 ${w} 20">
    <path d="M6 ${y}H${shaft}" ${line} fill="none"/>${dots}
    <path d="M${w - 17} 0 L${w} ${y} L${w - 17} 20z" fill="#000"/>
  </svg>`;
}

function tkPlatform(pf, L) {
  const dark = pf === 1;
  return `<div class="tk-pf ${dark ? 'dark' : ''}">
    ${feetSVG(dark ? '#fff' : '#000', 26)}
    <div class="tk-pf-text"><small>${T.platform[L]}</small><b>${pf}</b></div>
    <span class="tk-pf-colour">${PLATFORMS[pf].name[L]}</span>
  </div>`;
}

// The trip review as a black-and-white flow: start → change → get off → place.
function ticketFlow(trip, L, alt) {
  const lm = trip.lastMile;
  const nodes = trip.legs.length + 1 + (lm ? 1 : 0);
  const links = nodes - 1;
  const width = TICKET_W - TICKET_STUB - TICKET_PAD * 2;
  const linkW = Math.floor((width - nodes * TICKET_NODE) / links);

  const node = (role, key, name, altName, extra = '') => `
    <div class="tk-node">
      <div class="tk-role">${role}</div>
      <div class="tk-pic">${pictogram(key, 58)}</div>
      <div class="tk-name">${name}</div>
      ${altName && altName !== name ? `<div class="tk-alt">${altName}</div>` : ''}
      ${extra}
    </div>`;

  const link = (svg, big, small) => `
    <div class="tk-link" style="width:${linkW}px">
      ${svg}
      <div class="tk-cap"><b>${big}</b><span>${small}</span></div>
    </div>`;

  const station = id => STATIONS[id];
  let html = node(T.youAreHere[L], KIOSK_STATION, station(KIOSK_STATION)[L], station(KIOSK_STATION)[alt],
    tkPlatform(trip.legs[0].platform, L));
  trip.legs.forEach((leg, i) => {
    const count = leg.ids.length - 1;
    html += link(tkConnector(linkW, 'metro', leg.ids.length - 2),
      `${count} ${T[count === 1 ? 'stop' : 'stops'][L]}`, LINES[leg.line].name[L]);
    const next = trip.legs[i + 1];
    if (next) {
      const at = next.ids[0];
      html += node(`⇄ ${T.change[L]}`, at, station(at)[L], station(at)[alt], tkPlatform(next.platform, L));
    }
  });
  html += node(T.getOff[L], trip.to, station(trip.to)[L], station(trip.to)[alt],
    `<div class="tk-exit">EXIT <b>${trip.gate}</b></div>`);
  if (lm) {
    const walk = lm.mode === 'walk';
    html += link(tkConnector(linkW, walk ? 'walk' : 'cab'), `${lm.mins} ${T.min[L]}`, T[walk ? 'walk' : 'cab'][L]);
    const p = trip.place;
    html += node('', 'pin', p.name[L] || p.name.en, p.name[alt], `<div class="tk-dist">${fmtDist(lm.dist)}</div>`);
  }
  return `<div class="tk-flow">${html}</div>`;
}

function ticketHTML(tk, trip) {
  const L = tk.lang;
  const alt = L === 'en' ? 'gu' : 'en';
  const time = d => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = tk.issued.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const destObj = trip.place ? { name: trip.place.name[L] || trip.place.name.en, alt: trip.place.name[alt], key: 'pin' }
    : { name: STATIONS[trip.to][L], alt: STATIONS[trip.to][alt], key: trip.to };

  return `
    <div class="tk-main">
      <div class="tk-head">
        <span class="tk-logo">M</span><b>${T.appName[L]}</b>
        <span class="tk-meta">${date} · ${time(tk.issued)}<br>${T.ticketNo[L]} ${tk.no}</span>
      </div>
      <div class="tk-dest">
        <div class="tk-dest-pic">${pictogram(destObj.key, 56)}</div>
        <div class="tk-dest-name">
          <h2>${destObj.name}</h2>
          ${destObj.alt && destObj.alt !== destObj.name ? `<span>${destObj.alt}</span>` : ''}
        </div>
        <div class="tk-fact">${pictogram('clock', 34)}<div><small>${T.totalTime[L]}</small><b>${trip.totalMins} ${T.min[L]}</b></div></div>
        <div class="tk-fact"><div><small>${T.validTill[L]}</small><b>${time(tk.valid)}</b></div></div>
      </div>
      ${ticketFlow(trip, L, alt)}
    </div>
    <div class="tk-stub">
      <div class="tk-qr">${ticketQR(tk, trip)}</div>
      <div class="tk-scan">${T.scanGate[L]}</div>
      <div class="tk-people">${pictogram('people', 28)}<b>${tk.index} / ${tk.of}</b></div>
      <div class="tk-total">₹${tk.fare}</div>
      <div class="tk-paid">${T[tk.paidBy === 'cash' ? 'paidCash' : 'paidUpi'][L]}</div>
    </div>`;
}

/* ---------- demo preview: outside the kiosk flow, for showing the tickets to judges ---------- */

const previewEl = document.getElementById('demo-preview');
const preview = { index: 0, run: 0, single: [], all: null };

function ticketPreviewOpen() {
  return !previewEl.hidden;
}

function openTicketPreview() {
  const count = state.issued.length;
  preview.index = 0;
  previewEl.innerHTML = `
    <div class="dp-bar">Demo preview · the kiosk prints ${count === 1 ? 'this ticket' : `these ${count} tickets`}; this screen is not part of the kiosk</div>
    <div class="dp-stage">
      ${count > 1 ? '<button class="dp-nav" data-dp="prev" aria-label="Previous ticket">‹</button>' : ''}
      <div class="dp-fit"></div>
      ${count > 1 ? '<button class="dp-nav" data-dp="next" aria-label="Next ticket">›</button>' : ''}
    </div>
    ${count > 1 ? '<div class="dp-pager"></div>' : ''}
    <div class="dp-actions">
      <button class="btn dp-exit" data-dp="exit">✕ Exit preview</button>
      <a class="btn btn-go dp-save" data-save="one" aria-disabled="true">Preparing PDF…</a>
      ${count > 1 ? '<a class="btn btn-go dp-save" data-save="all" aria-disabled="true">Preparing PDF…</a>' : ''}
    </div>
    <div class="dp-note" role="status"></div>`;
  previewEl.hidden = false;
  showTicket(0);
  prepareTicketFiles();
}

function closeTicketPreview() {
  preview.run++;
  releaseTicketFiles();
  previewEl.hidden = true;
  previewEl.innerHTML = '';
  go('lang');
}

function showTicket(i) {
  const count = state.issued.length;
  preview.index = (i + count) % count;
  const tk = state.issued[preview.index];
  previewEl.querySelector('.dp-fit').innerHTML =
    `<div class="ticket" lang="${tk.lang}">${ticketHTML(tk, state.trip)}</div>`;
  const pager = previewEl.querySelector('.dp-pager');
  if (pager) pager.textContent = `Ticket ${tk.index} of ${count}`;
  fitTicket();
  linkDownloads();
}

function fitTicket() {
  if (!ticketPreviewOpen()) return;
  const stage = previewEl.querySelector('.dp-stage');
  const fit = previewEl.querySelector('.dp-fit');
  const ticket = fit.firstElementChild;
  const navs = [...stage.querySelectorAll('.dp-nav')].reduce((w, n) => w + n.offsetWidth + 20, 0);
  const scale = Math.min((stage.clientWidth - navs) / ticket.offsetWidth, stage.clientHeight / ticket.offsetHeight, 1.6);
  ticket.style.transform = `scale(${scale})`;
  fit.style.width = `${ticket.offsetWidth * scale}px`;
  fit.style.height = `${ticket.offsetHeight * scale}px`;
}

// Draws one ticket at print resolution from an off-screen, unscaled copy.
async function renderTicket(tk) {
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-3000px;top:0;';
  holder.innerHTML = `<div class="ticket" lang="${tk.lang}">${ticketHTML(tk, state.trip)}</div>`;
  document.body.append(holder);
  try {
    return await html2canvas(holder.firstElementChild, { scale: 3, backgroundColor: '#ffffff', logging: false });
  } finally {
    holder.remove();
  }
}

// One ticket-sized page per canvas.
function ticketPDF(canvases, name) {
  const pageH = c => (TICKET_PDF_W * c.height) / c.width;
  const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: [TICKET_PDF_W, pageH(canvases[0])], compress: true });
  canvases.forEach((c, i) => {
    if (i) pdf.addPage([TICKET_PDF_W, pageH(c)], 'landscape');
    pdf.addImage(c, 'PNG', 0, 0, TICKET_PDF_W, pageH(c), undefined, 'FAST');
  });
  return { url: URL.createObjectURL(pdf.output('blob')), name };
}

// PDFs are made up front so the buttons can be plain download links: a click on a real
// link saves the file directly, where a download started later by script can be ignored.
async function prepareTicketFiles() {
  const run = ++preview.run;
  const tickets = state.issued;
  await new Promise(r => setTimeout(r, 300));
  try {
    await document.fonts.ready;
    const canvases = [];
    for (const tk of tickets) {
      canvases.push(await renderTicket(tk));
      if (run !== preview.run) return;
    }
    preview.single = tickets.map((tk, i) => ticketPDF([canvases[i]], `ahmedabad-metro-ticket-${tk.no}.pdf`));
    if (tickets.length > 1) preview.all = ticketPDF(canvases, `ahmedabad-metro-tickets-${tickets[0].no}-all-${tickets.length}.pdf`);
    linkDownloads();
  } catch (err) {
    console.error('Ticket PDF failed', err);
    previewEl.querySelector('.dp-note').textContent = 'Could not create the PDF.';
  }
}

function linkDownloads() {
  const count = state.issued.length;
  const set = (key, file, label) => {
    const a = previewEl.querySelector(`[data-save="${key}"]`);
    if (!a || !file) return;
    a.href = file.url;
    a.download = file.name;
    a.textContent = label;
    a.removeAttribute('aria-disabled');
  };
  set('one', preview.single[preview.index], count > 1 ? `⬇ Ticket ${preview.index + 1} (PDF)` : '⬇ Download PDF');
  set('all', preview.all, `⬇ All ${count} tickets (PDF)`);
}

function releaseTicketFiles() {
  [...preview.single, preview.all].forEach(f => f && URL.revokeObjectURL(f.url));
  preview.single = [];
  preview.all = null;
}

previewEl.addEventListener('click', e => {
  const save = e.target.closest('[data-save]');
  if (save) {
    if (save.hasAttribute('aria-disabled')) { e.preventDefault(); return; }
    previewEl.querySelector('.dp-note').textContent = `Saved to your Downloads folder: ${save.download}`;
    return;
  }
  const btn = e.target.closest('[data-dp]');
  if (!btn) return;
  if (btn.dataset.dp === 'exit') closeTicketPreview();
  if (btn.dataset.dp === 'prev') showTicket(preview.index - 1);
  if (btn.dataset.dp === 'next') showTicket(preview.index + 1);
});

document.addEventListener('keydown', e => {
  if (!ticketPreviewOpen()) return;
  if (e.key === 'Escape') closeTicketPreview();
  if (state.issued.length > 1 && e.key === 'ArrowLeft') showTicket(preview.index - 1);
  if (state.issued.length > 1 && e.key === 'ArrowRight') showTicket(preview.index + 1);
});

window.addEventListener('resize', fitTicket);
