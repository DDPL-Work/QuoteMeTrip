/**
 * HeroIllustration — the full-width hero background SVG extracted from
 * quotemetrip-traveller (4) (3).html.
 *
 * The original used Math.random() to generate houses/trees.
 * Here we use a deterministic seeded set so it renders the same every time.
 */

// Deterministic house/tree positions (seeded from reference HTML logic)
const HOUSES = [
  // [x, y, w, h] — right half of canvas
  [820, 340, 38, 28],
  [890, 310, 30, 22],
  [960, 360, 44, 20],
  [1030, 330, 36, 25],
  [1100, 300, 28, 18],
  [1150, 355, 40, 24],
  [1220, 320, 32, 20],
  [1290, 345, 42, 26],
  [1360, 310, 34, 22],
  [1430, 340, 38, 20],
  [1490, 300, 28, 18],
  [1540, 360, 36, 24],
  [870, 400, 44, 30],
  [950, 420, 38, 26],
  [1020, 390, 30, 20],
  [1090, 415, 42, 28],
  [1160, 380, 36, 22],
  [1240, 410, 34, 24],
  [1320, 390, 40, 28],
  [1400, 420, 30, 20],
  [1460, 400, 38, 26],
  [1520, 380, 44, 30],
  [1570, 420, 32, 22],
  [1590, 360, 28, 18],
  [810, 460, 36, 24],
  [880, 440, 40, 28],
  [940, 470, 30, 20],
  [1000, 450, 44, 26],
  [1070, 460, 38, 22],
  [1140, 440, 34, 28],
  [1200, 475, 42, 24],
  [1270, 455, 30, 20],
  [1340, 470, 36, 26],
  [1410, 445, 40, 30],
  [1470, 465, 28, 18],
  [1535, 455, 44, 28],
];

const TREES = [
  [830, 360],
  [920, 380],
  [1010, 340],
  [1080, 380],
  [1170, 350],
  [1260, 370],
  [1330, 390],
  [1420, 360],
  [1500, 345],
  [1560, 375],
  [860, 430],
  [990, 440],
  [1110, 430],
  [1230, 445],
];

export function HeroIllustration({ className, style, ...props }) {
  return (
    <svg
      viewBox="0 0 1600 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      {...props}
    >
      {/* Sky */}
      <rect width="1600" height="640" fill="#F3DCC2" />
      {/* Sun */}
      <circle cx="1230" cy="150" r="96" fill="#F9EAD3" />
      {/* Landscape hills */}
      <path d="M0 330 Q300 290 620 318 T1600 300 V640 H0Z" fill="#E7C6A6" />
      <path d="M760 640 L760 330 Q1000 250 1260 262 Q1450 270 1600 230 V640Z" fill="#DDBB94" />

      {/* Houses */}
      {HOUSES.map(([x, y, w, h], i) => (
        <g key={`h${i}`}>
          <rect x={x} y={y} width={w} height={h} fill="#FBF8F2" />
          <rect x={x + w} y={y + 3} width={6} height={h - 3} fill="#E6DCCB" />
          <rect x={x + w * 0.35} y={y + h * 0.4} width={5} height={7} fill="#7A8C8A" />
        </g>
      ))}

      {/* Trees */}
      {TREES.map(([x, y], i) => (
        <ellipse key={`t${i}`} cx={x} cy={y} rx={10} ry={16} fill="#5E7A4E" />
      ))}

      {/* Sea */}
      <rect y="540" width="1600" height="100" fill="#2F6479" />
      <g fill="#5A8C9C">
        <rect x="120" y="566" width="220" height="4" rx="2" />
        <rect x="460" y="596" width="300" height="4" rx="2" />
        <rect x="900" y="572" width="200" height="4" rx="2" />
        <rect x="1240" y="606" width="260" height="4" rx="2" />
      </g>

      {/* Boat */}
      <path d="M560 560 H660 L646 578 H574Z" fill="#FBF8F2" />
      <path d="M606 556 V486 L650 552Z" fill="#FBF8F2" />
      <path d="M602 556 V500 L572 552Z" fill="#EFE6D6" />
    </svg>
  );
}
