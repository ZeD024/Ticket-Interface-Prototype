/* Black-and-white pictograms for the printed ticket: one unique symbol per station,
   drawn as solid shapes on a 48×48 grid so they survive a thermal printer.
   Colours are written on the shapes (not in CSS) so they also export to the PDF. */

const BK = 'stroke="#000" fill="none"';

const PICTOGRAMS = {
  // Blue line
  'thaltej-gam': /* hut */ `<path d="M24 5C14 5 7 15 3 25h42C41 15 34 5 24 5z"/><path d="M9 27h30v16H9z"/><path d="M19 31h10v12H19z" fill="#fff"/>`,
  'thaltej': /* shopping bag */ `<path d="M9 16h30l3 29H6z"/><path d="M16 21v-9a8 8 0 0 1 16 0v9" ${BK} stroke-width="3.5"/><circle cx="16" cy="22" r="2.4" fill="#fff"/><circle cx="32" cy="22" r="2.4" fill="#fff"/>`,
  'doordarshan': /* TV tower */ `<path d="M22.5 2h3v9h-3z"/><path d="M18 11h12l2 6H16z"/><path d="M21 17h6l6 29h-5l-4-9-4 9h-5z"/><path d="M12 24h24" ${BK} stroke-width="3"/>`,
  'gurukul': /* open book */ `<path d="M24 12C19 8 11 7 4 8v30c7-1 15 0 20 4 5-4 13-5 20-4V8c-7-1-15 0-20 4z"/><path d="M24 14v26M9 15c3 0 6 .6 10 2M9 22c3 0 6 .6 10 2M9 29c3 0 6 .6 10 2M39 15c-3 0-6 .6-10 2M39 22c-3 0-6 .6-10 2M39 29c-3 0-6 .6-10 2" stroke="#fff" stroke-width="2.2" fill="none"/>`,
  'gujarat-uni': /* graduation cap */ `<path d="M24 9 2 20l22 11 22-11z"/><path d="M12 28v8c4 5 20 5 24 0v-8l-12 6z"/><path d="M42 22v13" ${BK} stroke-width="2.6"/><circle cx="42" cy="37" r="3"/>`,
  'commerce': /* six roads meeting */ `<path d="M24 2v44M5 13l38 22M5 35l38-22" ${BK} stroke-width="7"/><circle cx="24" cy="24" r="8" fill="#fff" stroke="#000" stroke-width="3.5"/>`,
  'stadium': /* stadium bowl and lights */ `<ellipse cx="24" cy="30" rx="22" ry="14"/><ellipse cx="24" cy="29" rx="13.5" ry="7" fill="#fff"/><path d="M7 18V6M41 18V6" ${BK} stroke-width="3"/><path d="M2 3h10v5H2zM36 3h10v5H36z"/>`,
  'ohc': /* scales of justice */ `<path d="M24 4v36M7 11h34" ${BK} stroke-width="4"/><path d="M14 40h20v5H14z"/><path d="M8 11 2.5 27M8 11l5.500 16M40 11l-5.500 16M40 11l5.500 16" ${BK} stroke-width="2"/><path d="M0 27h16a8 8 0 0 1-16 0zM32 27h16a8 8 0 0 1-16 0z"/>`,
  'shahpur': /* old city gate */ `<path d="M4 45V15l3-3V5h6v4h5V5h12v4h5V5h6v7l3 3v30H32V29a8 8 0 0 0-16 0v16z"/>`,
  'gheekanta': /* ghee pot */ `<path d="M16 4h16v4l-3 4c9 3 13 11 13 18 0 9-7 15-18 15S6 39 6 30c0-7 4-15 13-18l-3-4z"/><path d="M8 26h32" stroke="#fff" stroke-width="3" fill="none"/>`,
  'kalupur': /* train, front view */ `<path d="M12 3h24a7 7 0 0 1 7 7v25a7 7 0 0 1-7 7H12a7 7 0 0 1-7-7V10a7 7 0 0 1 7-7z"/><rect x="11" y="9" width="26" height="14" rx="2" fill="#fff"/><circle cx="14" cy="32" r="3.200" fill="#fff"/><circle cx="34" cy="32" r="3.200" fill="#fff"/><path d="M14 41 9 47h6l4-6zM34 41l5 6h-6l-4-6z"/>`,
  'kankaria-east': /* ferris wheel */ `<circle cx="24" cy="20" r="15" ${BK} stroke-width="3"/><path d="M24 5v30M9 20h30M13.400 9.400l21.200 21.200M13.400 30.600l21.200-21.200" ${BK} stroke-width="2"/><path d="M24 20 12 46h5l7-15 7 15h5z"/><circle cx="24" cy="5" r="3.500"/><circle cx="39" cy="20" r="3.500"/><circle cx="9" cy="20" r="3.500"/><circle cx="34.600" cy="9.400" r="3.500"/><circle cx="13.400" cy="9.400" r="3.500"/><circle cx="34.600" cy="30.600" r="3.500"/><circle cx="13.400" cy="30.600" r="3.500"/>`,
  'apparel-park': /* shirt */ `<path d="M17 6 3 14l5 10 5-3v22h22V21l5 3 5-10-14-8c-1 5-13 5-14 0z"/>`,
  'amraiwadi': /* mango */ `<path d="M30 13c10 3 14 14 9 22-5 9-17 11-26 6C6 37 5 29 9 23c4-7 13-12 21-10z"/><path d="M29 13c0-3 1-6 4-9" ${BK} stroke-width="3"/><path d="M31 9c4-6 10-6 15-3-3 6-10 7-15 3z"/>`,
  'rabari': /* cow */ `<path d="M13 12C8 11 5 7 5 3c3 3 6 5 10 5 2-1 5-2 9-2s7 1 9 2c4 0 7-2 10-5 0 4-3 8-8 9l1 7 7 1c0 3-3 5-6 5h-3l-1 8c0 7-4 12-9 12s-9-5-9-12l-1-8h-3c-3 0-6-2-6-5l7-1z"/><circle cx="18" cy="20" r="2.600" fill="#fff"/><circle cx="30" cy="20" r="2.600" fill="#fff"/><ellipse cx="24" cy="36" rx="6.500" ry="4.500" fill="#fff"/>`,
  'vastral': /* apartment block */ `<path d="M11 3h26v43H11z"/><path d="M16 8h6v6h-6zM26 8h6v6h-6zM16 18h6v6h-6zM26 18h6v6h-6zM16 28h6v6h-6zM26 28h6v6h-6zM20 38h8v8h-8z" fill="#fff"/>`,
  'nirant': /* traffic light */ `<rect x="14" y="1" width="20" height="37" rx="5"/><circle cx="24" cy="9" r="4.500" fill="#fff"/><circle cx="24" cy="19.500" r="4.500" fill="#fff"/><circle cx="24" cy="30" r="4.500" fill="#fff"/><path d="M24 38v8M15 46h18" ${BK} stroke-width="3.500"/>`,
  'vastral-gam': /* village well */ `<path d="M4 15 24 4l20 11z"/><path d="M11 15v16M37 15v16" ${BK} stroke-width="3.500"/><path d="M24 15v7" ${BK} stroke-width="2"/><path d="M19 22h10l-1.500 7h-7z"/><path d="M5 31h38v15H5z"/><path d="M5 38.500h38" stroke="#fff" stroke-width="2.500" fill="none"/>`,

  // Red line
  'motera': /* cricket bat and ball */ `<path d="M6 33 28 11l9 9L15 42c-2 2-5 2-7 0l-2-2c-2-2-2-5 0-7z"/><path d="M33 15 43 5" ${BK} stroke-width="5.500" stroke-linecap="round"/><circle cx="37" cy="37" r="6.500"/>`,
  'sabarmati': /* river */ `<circle cx="24" cy="10" r="8"/><path d="M3 27c5-6 9-6 14 0s9 6 14 0 9-6 14 0M3 37c5-6 9-6 14 0s9 6 14 0 9-6 14 0" ${BK} stroke-width="5" stroke-linecap="round"/>`,
  'aec': /* lightning bolt */ `<path d="M29 2 7 27h14l-5 19 25-28H27z"/>`,
  'sabarmati-rly': /* steam engine */ `<path d="M4 17h9V9h-3V4h12v5h-3v8h10V7h14v24H4z"/><path d="M34 12h6v7h-6z" fill="#fff"/><circle cx="13" cy="36" r="5.500"/><circle cx="27" cy="36" r="5.500"/><circle cx="39" cy="36" r="4"/><path d="M1 45h46" ${BK} stroke-width="3.500"/>`,
  'ranip': /* bus */ `<path d="M3 10h37c4 0 6 4 6 8v18H3z"/><path d="M8 15h8v9H8zM19 15h8v9h-8zM30 15h7v9h-7zM40 15h3v9h-3z" fill="#fff"/><circle cx="13" cy="37" r="6" stroke="#fff" stroke-width="2"/><circle cx="36" cy="37" r="6" stroke="#fff" stroke-width="2"/>`,
  'vadaj': /* auto rickshaw */ `<path d="M7 31c0-13 6-22 17-22h8c7 0 11 9 12 22z"/><path d="M14 28c1-7 4-14 11-14h2v14zM31 14h1c4 0 7 7 8 14h-9z" fill="#fff"/><path d="M4 31h41v5H4z"/><circle cx="12" cy="38" r="6" stroke="#fff" stroke-width="2"/><circle cx="38" cy="38" r="6" stroke="#fff" stroke-width="2"/>`,
  'vijay-nagar': /* victory flag */ `<path d="M10 3v43" ${BK} stroke-width="4" stroke-linecap="round"/><path d="M12 5h31l-9 10.500L43 26H12z"/>`,
  'usmanpura': /* tree */ `<circle cx="24" cy="14" r="12"/><circle cx="13" cy="22" r="9.500"/><circle cx="35" cy="22" r="9.500"/><path d="M21 26h6v20h-6z"/><path d="M14 46h20" ${BK} stroke-width="3"/>`,
  'gandhigram': /* round spectacles */ `<circle cx="13" cy="25" r="10" ${BK} stroke-width="4.500"/><circle cx="35" cy="25" r="10" ${BK} stroke-width="4.500"/><path d="M22 22c1.500-1.500 2.500-1.500 4 0M3.500 21 1 13M44.500 21l2.500-8" ${BK} stroke-width="3.500" stroke-linecap="round"/>`,
  'paldi': /* museum columns */ `<path d="M24 2 2 15v4h44v-4z"/><path d="M7 22h6v17H7zM16 22h6v17h-6zM26 22h6v17h-6zM35 22h6v17h-6z"/><path d="M2 41h44v5H2z"/>`,
  'shreyas': /* railway crossing sign */ `<path d="M5 5l38 26M43 5 5 31" ${BK} stroke-width="7"/><path d="M24 18v28" ${BK} stroke-width="5"/><path d="M14 46h20" ${BK} stroke-width="3.500"/>`,
  'rajiv-nagar': /* house */ `<path d="M24 4 2 24h6v21h32V24h6l-8-7.300V7h-6v4.300z"/><path d="M20 30h8v15h-8z" fill="#fff"/>`,
  'jivraj': /* flower */ `<circle cx="24" cy="8" r="6.500"/><circle cx="34.400" cy="14" r="6.500"/><circle cx="34.400" cy="26" r="6.500"/><circle cx="24" cy="32" r="6.500"/><circle cx="13.600" cy="26" r="6.500"/><circle cx="13.600" cy="14" r="6.500"/><circle cx="24" cy="20" r="6" fill="#fff"/><path d="M24 34v13" ${BK} stroke-width="3.500"/>`,
  'apmc': /* carrot, for the vegetable market */ `<path d="M17 16c5-5 15 0 14 8L10 45c-2 1-4 0-3-3z"/><path d="M29 17c-2-6 1-12 5-15 3 4 2 10-1 12 3-3 8-4 13-2-2 5-8 7-12 6-1 0-3 0-5-1z"/>`,

  // Journey symbols
  pin: `<path d="M24 2C15 2 7 10 7 19c0 12 17 27 17 27s17-15 17-27c0-9-8-17-17-17z"/><circle cx="24" cy="19" r="6.500" fill="#fff"/>`,
  walk: `<circle cx="27" cy="7" r="5.500"/><path d="M22 14c3-1 6-1 8 1l5 8 7 3-2 4-9-4-3-3-2 8 6 6 2 12h-5l-3-10-6-5-3 15h-5l4-21 1-9-4 3-1 8H8l1-11z"/>`,
  people: `<circle cx="24" cy="12" r="9"/><path d="M6 45c0-13 8-21 18-21s18 8 18 21z"/>`,
  clock: `<circle cx="24" cy="24" r="21"/><path d="M24 11v14l10 6" stroke="#fff" stroke-width="4.500" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
};
PICTOGRAMS.cab = PICTOGRAMS.vadaj;

// A pictogram as an inline SVG of the given pixel size.
function pictogram(key, size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" fill="#000">${PICTOGRAMS[key] || PICTOGRAMS.pin}</svg>`;
}
