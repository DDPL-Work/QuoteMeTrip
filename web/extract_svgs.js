const fs = require('fs');

function rnd(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function scene(kind) {
  const W = 400,
    H = 260,
    o = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="width: 100%; height: auto;">`;
  let s = '';
  if (kind === 'city') {
    s = `<rect width="400" height="260" fill="#EFC39A"/><circle cx="300" cy="86" r="36" fill="#F8E4C6"/>
<path d="M0 150 Q100 132 200 146 T400 140 V200 H0Z" fill="#D9A27A"/>
<g fill="#3B3340"><rect x="40" y="168" width="330" height="36"/><path d="M110 170 A50 50 0 0 1 210 170Z"/><path d="M150 124 A10 10 0 0 1 170 124 V130 H150Z"/><rect x="158" y="104" width="4" height="22"/>
<path d="M225 172 A32 32 0 0 1 289 172Z"/><path d="M60 172 A24 24 0 0 1 108 172Z"/>
<rect x="92" y="96" width="7" height="76"/><path d="M90 98 L95.5 66 L101 98Z"/><rect x="220" y="104" width="7" height="68"/><path d="M218 106 L223.5 76 L229 106Z"/><rect x="296" y="112" width="6" height="60"/><path d="M294 114 L299 88 L304 114Z"/><rect x="318" y="140" width="40" height="32"/></g>
<rect y="200" width="400" height="60" fill="#2F5D6B"/><g fill="#5C8A94"><rect x="30" y="214" width="60" height="3" rx="1.5"/><rect x="150" y="226" width="90" height="3" rx="1.5"/><rect x="280" y="212" width="70" height="3" rx="1.5"/><rect x="70" y="242" width="80" height="3" rx="1.5"/></g>
<path d="M250 234 H300 L292 244 H258Z" fill="#FFFBF3"/><rect x="270" y="222" width="12" height="12" fill="#FFFBF3"/>`;
  }
  if (kind === 'balloons') {
    s = `<rect width="400" height="260" fill="#F6D7B8"/><path d="M0 170 Q80 140 170 160 T400 150 V260 H0Z" fill="#E3B48C"/>
<g fill="#C98E62"><path d="M40 260 L62 150 Q70 140 78 150 L100 260Z"/><path d="M120 260 L138 176 Q145 166 152 176 L170 260Z"/><path d="M250 260 L272 160 Q281 148 290 160 L312 260Z"/><path d="M320 260 L336 190 Q342 182 348 190 L364 260Z"/></g>
<path d="M0 226 Q120 212 220 222 T400 216 V260 H0Z" fill="#B77A52"/>
${[
  [90, 70, 26, '#A85F00'],
  [205, 52, 32, '#147D33'],
  [310, 86, 22, '#E0A43B'],
  [160, 118, 15, '#8A3517'],
  [365, 40, 14, '#A85F00'],
  [40, 40, 12, '#147D33'],
]
  .map(
    ([x, y, r, c]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${c}"/><path d="M${x - r * 0.7} ${y + r * 0.8} L${x - r * 0.2} ${y + r * 1.55} H${x + r * 0.2} L${x + r * 0.7} ${y + r * 0.8}Z" fill="${c}"/><rect x="${x - r * 0.22}" y="${y + r * 1.6}" width="${r * 0.44}" height="${r * 0.35}" fill="#5A3B2A"/><rect x="${x - 1}" y="${y - r * 1.15}" width="2" height="${r * 2.3}" fill="rgba(255,255,255,.25)"/>`,
  )
  .join('')}`;
  }
  if (kind === 'coast') {
    s = `<rect width="400" height="260" fill="#CFE3E8"/><circle cx="330" cy="60" r="24" fill="#F7F1E4"/><rect y="150" width="400" height="110" fill="#2E6F8E"/>
<g fill="#5A92AC"><rect x="220" y="170" width="80" height="3" rx="1.5"/><rect x="300" y="196" width="70" height="3" rx="1.5"/><rect x="240" y="226" width="110" height="3" rx="1.5"/></g>
<path d="M0 96 Q60 84 120 100 Q170 116 200 150 L230 260 H0Z" fill="#A7825F"/><path d="M0 110 Q60 98 120 112 Q160 124 186 150 L210 260 H0Z" fill="#E9E1D3"/>
${(() => {
  const r = rnd(7);
  let h = '';
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * 170),
      y = 112 + Math.floor(r() * 120);
    if (x > y * 0.9 - 20) continue;
    const w = 14 + r() * 14,
      hh = 10 + r() * 10;
    h += `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#FFFFFF"/><rect x="${x + w * 0.3}" y="${y + hh * 0.35}" width="3" height="4" fill="#2B5C9E"/>`;
  }
  return h;
})()}
<path d="M60 116 A12 12 0 0 1 84 116Z" fill="#2B5C9E"/><path d="M120 150 A10 10 0 0 1 140 150Z" fill="#2B5C9E"/><rect x="60" y="116" width="24" height="16" fill="#fff"/><rect x="120" y="150" width="20" height="14" fill="#fff"/>`;
  }
  if (kind === 'pyramids') {
    s = `<rect width="400" height="260" fill="#F4D9A6"/><circle cx="90" cy="70" r="30" fill="#FBEBCB"/>
<path d="M150 190 L240 80 L330 190Z" fill="#D9A661"/><path d="M240 80 L330 190 H260Z" fill="#B9834A"/>
<path d="M60 196 L120 124 L180 196Z" fill="#D9A661"/><path d="M120 124 L180 196 H138Z" fill="#B9834A"/>
<path d="M300 200 L335 158 L370 200Z" fill="#D9A661"/><path d="M335 158 L370 200 H346Z" fill="#B9834A"/>
<path d="M0 196 Q120 178 220 194 T400 186 V260 H0Z" fill="#E2B877"/><path d="M0 230 Q140 214 260 228 T400 222 V260 H0Z" fill="#CF9F5E"/>
<g fill="#6B4A2A"><rect x="60" y="214" width="16" height="7" rx="3"/><rect x="72" y="208" width="4" height="8"/><rect x="62" y="221" width="2" height="8"/><rect x="72" y="221" width="2" height="8"/></g>`;
  }
  if (kind === 'mountains') {
    s = `<rect width="400" height="260" fill="#D8E4E0"/><path d="M-20 190 L90 60 L170 150 L250 40 L340 140 L420 90 V260 H-20Z" fill="#7E98A0"/>
<path d="M90 60 L112 86 L100 84 L88 96 L74 80Z M250 40 L276 72 L262 68 L248 82 L232 62Z" fill="#fff"/>
<path d="M-20 210 L60 150 L140 200 L230 130 L320 190 L420 150 V260 H-20Z" fill="#4F6A72"/>
<path d="M0 214 Q110 190 210 208 T400 200 V260 H0Z" fill="#6E8B5A"/><path d="M0 240 Q140 226 260 238 T400 232 V260 H0Z" fill="#56733F"/>
<g><rect x="196" y="176" width="22" height="22" fill="#8C6A4F"/><path d="M193 178 L207 162 L221 178Z" fill="#5B4535"/><rect x="214" y="166" width="10" height="32" fill="#8C6A4F"/><path d="M212 168 L219 150 L226 168Z" fill="#5B4535"/></g>`;
  }
  if (kind === 'ruins') {
    s = `<rect width="400" height="260" fill="#F0D2B0"/><circle cx="320" cy="70" r="28" fill="#F8E6CE"/>
<path d="M40 210 V110 Q200 70 360 110 V210Z" fill="#D6B58C"/><path d="M40 110 Q200 70 360 110 V126 Q200 88 40 126Z" fill="#C9A77F"/>
${[0, 1, 2].map((r) => Array.from({ length: 9 }, (_, i) => `<rect x="${56 + i * 34}" y="${132 + r * 26}" width="16" height="18" rx="8" fill="#9E7B55"/>`).join('')).join('')}
<path d="M300 118 Q340 110 360 110 V210 H300Z" fill="#E9D3B2" opacity=".6"/>
<path d="M0 206 H400 V260 H0Z" fill="#B9A07A"/>
${[20, 370, 386].map((x) => `<ellipse cx="${x}" cy="176" rx="9" ry="40" fill="#3E5A3A"/>`).join('')}`;
  }
  return o + s + '</svg>';
}

function heroScene() {
  const r = rnd(3);
  let houses = '';
  for (let i = 0; i < 70; i++) {
    const x = 780 + r() * 820,
      base = 300 + (x - 780) * 0.12,
      y = base + r() * 260;
    if (y > 520) continue;
    const w = 26 + r() * 30,
      h = 18 + r() * 22;
    houses += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#FBF8F2"/><rect x="${(x + w).toFixed(0)}" y="${(y + 3).toFixed(0)}" width="6" height="${(h - 3).toFixed(0)}" fill="#E6DCCB"/><rect x="${(x + w * 0.35).toFixed(0)}" y="${(y + h * 0.4).toFixed(0)}" width="5" height="7" fill="#7A8C8A"/>`;
  }
  for (let i = 0; i < 14; i++) {
    const x = 800 + r() * 780,
      y = 320 + r() * 200;
    houses += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="10" ry="16" fill="#5E7A4E"/>`;
  }
  return `<svg viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="width: 100%; height: auto;"><rect width="1600" height="640" fill="#F3DCC2"/>
<circle cx="1230" cy="150" r="96" fill="#F9EAD3"/><path d="M0 330 Q300 290 620 318 T1600 300 V640 H0Z" fill="#E7C6A6"/>
<path d="M760 640 L760 330 Q1000 250 1260 262 Q1450 270 1600 230 V640Z" fill="#DDBB94"/>${houses}
<rect y="540" width="1600" height="100" fill="#2F6479"/><g fill="#5A8C9C"><rect x="120" y="566" width="220" height="4" rx="2"/><rect x="460" y="596" width="300" height="4" rx="2"/><rect x="900" y="572" width="200" height="4" rx="2"/><rect x="1240" y="606" width="260" height="4" rx="2"/></g>
<path d="M560 560 H660 L646 578 H574Z" fill="#FBF8F2"/><path d="M606 556 V486 L650 552Z" fill="#FBF8F2"/><path d="M602 556 V500 L572 552Z" fill="#EFE6D6"/></svg>`;
}

function mockPlan() {
  return `<svg viewBox="0 0 320 210" role="img" aria-label="Itinerary builder" style="width: 100%; height: auto;">
<rect width="320" height="210" rx="14" fill="#FFFBF3"/>
<rect x="16" y="14" width="120" height="10" rx="5" fill="#0C4E28"/>
${[0, 1, 2]
  .map(
    (
      i,
    ) => `<g transform="translate(16,${38 + i * 52})"><rect width="288" height="44" rx="10" fill="#fff" stroke="#E2DCD1"/>
<text x="12" y="27" font-family="Poppins,sans-serif" font-size="15" font-weight="700" fill="#FC7C00">${i + 1}</text>
<rect x="30" y="13" width="54" height="8" rx="4" fill="#C9C1B3"/><rect x="94" y="13" width="72" height="8" rx="4" fill="#13291C"/>
<rect x="176" y="10" width="34" height="15" rx="7.5" fill="${['#147D33', '#147D33', '#E5F2EA'][i]}"/><rect x="216" y="10" width="28" height="15" rx="7.5" fill="${['#147D33', '#E5F2EA', '#E5F2EA'][i]}"/><rect x="250" y="10" width="28" height="15" rx="7.5" fill="#147D33"/></g>`,
  )
  .join('')}
<rect x="16" y="194" width="288" height="1" fill="#EEE8DE"/>
<g transform="translate(16,166)"><rect width="288" height="26" rx="8" fill="#fff" stroke="#B9AE9C" stroke-dasharray="4 4"/><text x="144" y="17" text-anchor="middle" font-family="Poppins,sans-serif" font-size="11" font-weight="700" fill="#13291C">+ Add day</text></g></svg>`;
}

function mockQuotes() {
  return `<svg viewBox="0 0 320 210" role="img" aria-label="Agency quotes" style="width: 100%; height: auto;">
<rect width="320" height="210" rx="14" fill="#FFFBF3"/>
${[
  ['#147D33', '2,450', '4.9', 1],
  ['#E2DCD1', '1,980', '4.5', 0],
  ['#E2DCD1', '2,190', '4.3', 0],
]
  .map(
    ([c, pr, rt, hi], i) => `<g transform="translate(16,${14 + i * 64})">
<rect width="288" height="54" rx="12" fill="#fff" stroke="${c}" stroke-width="${hi ? 2 : 1}"/>
<circle cx="26" cy="27" r="13" fill="#E5F2EA"/><text x="26" y="32" text-anchor="middle" font-family="Poppins,sans-serif" font-size="12" font-weight="700" fill="#147D33">A${i + 1}</text>
<rect x="48" y="14" width="86" height="9" rx="4.5" fill="#13291C"/>
<text x="48" y="40" font-family="Poppins,sans-serif" font-size="10" font-weight="700" fill="#B45A00">★ ${rt}</text>
<rect x="96" y="32" width="26" height="9" rx="4.5" fill="#E5F2EA"/><rect x="126" y="32" width="34" height="9" rx="4.5" fill="#E5F2EA"/><rect x="164" y="32" width="22" height="9" rx="4.5" fill="#E5F2EA"/>
<text x="276" y="26" text-anchor="end" font-family="Poppins,sans-serif" font-size="16" font-weight="700" fill="#13291C">€ ${pr}</text>
${hi ? '<rect x="196" y="32" width="80" height="16" rx="8" fill="#FC7C00"/><text x="236" y="43.5" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9" font-weight="700" fill="#13291C">AGREE</text>' : ''}</g>`,
  )
  .join('')}</svg>`;
}

function mockPay() {
  return `<svg viewBox="0 0 320 210" role="img" aria-label="Payment and confirmation" style="width: 100%; height: auto;">
<rect width="320" height="210" rx="14" fill="#FFFBF3"/>
<g transform="translate(16,14)"><rect width="288" height="46" rx="12" fill="#fff" stroke="#E2DCD1"/>
<rect x="14" y="13" width="120" height="8" rx="4" fill="#C9C1B3"/><rect x="14" y="27" width="70" height="10" rx="5" fill="#13291C"/>
<rect x="180" y="12" width="94" height="24" rx="8" fill="#0C4E28"/><text x="227" y="28" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10" font-weight="700" fill="#fff">Payment link</text></g>
<g transform="translate(16,70)"><rect width="288" height="40" rx="12" fill="#DCEBDD" stroke="#9BC3A2"/>
<rect x="14" y="12" width="16" height="16" rx="4" fill="#147D33"/><path d="M18 20l3 3 6-6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<text x="40" y="25" font-family="Poppins,sans-serif" font-size="11" font-weight="700" fill="#245A31">Deposit paid · contacts unlocked</text></g>
<g transform="translate(16,120)"><rect width="288" height="74" rx="12" fill="#0C4E28"/>
<text x="14" y="22" font-family="Poppins,sans-serif" font-size="9" font-weight="800" fill="#FDBE6A">BOOKING CONFIRMATION</text>
${[0, 1, 2].map((i) => `<g transform="translate(14,${30 + i * 14})"><text font-family="Poppins,sans-serif" font-size="9" font-weight="700" fill="#fff" y="8">Day ${i + 1}</text><rect x="34" y="1" width="${[86, 70, 94][i]}" height="7" rx="3.5" fill="#3D7352"/></g>`).join('')}
<rect x="196" y="44" width="78" height="20" rx="8" fill="#FC7C00"/><text x="235" y="57.5" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9" font-weight="700" fill="#13291C">Print / PDF</text></g></svg>`;
}

const out = {
  hero: heroScene(),
  plan: mockPlan(),
  quotes: mockQuotes(),
  pay: mockPay(),
  city: scene('city'),
  balloons: scene('balloons'),
  coast: scene('coast'),
  pyramids: scene('pyramids'),
  mountains: scene('mountains'),
  ruins: scene('ruins'),
};

fs.writeFileSync('svgs.json', JSON.stringify(out, null, 2));
