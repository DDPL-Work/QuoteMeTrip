/**
 * SceneIllustration — route/destination scene cards extracted from the
 * reference HTML (quotemetrip-traveller (4) (3).html).
 *
 * Supports kinds: city | balloons | coast | pyramids | mountains | ruins
 *
 * Uses static, deterministic SVG (no random) for React SSR/hydration safety.
 */

// --- city (Istanbul) ---
function CityScene({ className, style, ...props }) {
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      {...props}
    >
      <rect width="400" height="260" fill="#EFC39A" />
      <circle cx="300" cy="86" r="36" fill="#F8E4C6" />
      <path d="M0 150 Q100 132 200 146 T400 140 V200 H0Z" fill="#D9A27A" />
      <g fill="#3B3340">
        <rect x="40" y="168" width="330" height="36" />
        <path d="M110 170 A50 50 0 0 1 210 170Z" />
        <path d="M150 124 A10 10 0 0 1 170 124 V130 H150Z" />
        <rect x="158" y="104" width="4" height="22" />
        <path d="M225 172 A32 32 0 0 1 289 172Z" />
        <path d="M60 172 A24 24 0 0 1 108 172Z" />
        <rect x="92" y="96" width="7" height="76" />
        <path d="M90 98 L95.5 66 L101 98Z" />
        <rect x="220" y="104" width="7" height="68" />
        <path d="M218 106 L223.5 76 L229 106Z" />
        <rect x="296" y="112" width="6" height="60" />
        <path d="M294 114 L299 88 L304 114Z" />
        <rect x="318" y="140" width="40" height="32" />
      </g>
      <rect y="200" width="400" height="60" fill="#2F5D6B" />
      <g fill="#5C8A94">
        <rect x="30" y="214" width="60" height="3" rx="1.5" />
        <rect x="150" y="226" width="90" height="3" rx="1.5" />
        <rect x="280" y="212" width="70" height="3" rx="1.5" />
        <rect x="70" y="242" width="80" height="3" rx="1.5" />
      </g>
      <path d="M250 234 H300 L292 244 H258Z" fill="#FFFBF3" />
      <rect x="270" y="222" width="12" height="12" fill="#FFFBF3" />
    </svg>
  );
}

// --- balloons (Cappadocia) ---
function BalloonsScene({ className, style, ...props }) {
  const balloons = [
    [90, 70, 26, '#A85F00'],
    [205, 52, 32, '#147D33'],
    [310, 86, 22, '#E0A43B'],
    [160, 118, 15, '#8A3517'],
    [365, 40, 14, '#A85F00'],
    [40, 40, 12, '#147D33'],
  ];
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      {...props}
    >
      <rect width="400" height="260" fill="#F6D7B8" />
      <path d="M0 170 Q80 140 170 160 T400 150 V260 H0Z" fill="#E3B48C" />
      <g fill="#C98E62">
        <path d="M40 260 L62 150 Q70 140 78 150 L100 260Z" />
        <path d="M120 260 L138 176 Q145 166 152 176 L170 260Z" />
        <path d="M250 260 L272 160 Q281 148 290 160 L312 260Z" />
        <path d="M320 260 L336 190 Q342 182 348 190 L364 260Z" />
      </g>
      <path d="M0 226 Q120 212 220 222 T400 216 V260 H0Z" fill="#B77A52" />
      {balloons.map(([x, y, r, c], idx) => (
        <g key={idx}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={c} />
          <path
            d={`M${x - r * 0.7} ${y + r * 0.8} L${x - r * 0.2} ${y + r * 1.55} H${x + r * 0.2} L${x + r * 0.7} ${y + r * 0.8}Z`}
            fill={c}
          />
          <rect
            x={x - r * 0.22}
            y={y + r * 1.6}
            width={r * 0.44}
            height={r * 0.35}
            fill="#5A3B2A"
          />
          <rect
            x={x - 1}
            y={y - r * 1.15}
            width="2"
            height={r * 2.3}
            fill="rgba(255,255,255,.25)"
          />
        </g>
      ))}
    </svg>
  );
}

// --- coast (Santorini/Greece) ---
function CoastScene({ className, style, ...props }) {
  // Deterministic houses — same positions every render
  const houses = [
    [10, 130, 18, 14],
    [30, 148, 22, 12],
    [6, 172, 16, 10],
    [38, 186, 20, 11],
    [60, 142, 20, 15],
    [74, 160, 14, 10],
    [88, 178, 18, 12],
    [100, 196, 14, 10],
    [46, 210, 22, 12],
    [20, 220, 16, 10],
    [60, 224, 18, 11],
    [80, 214, 14, 12],
  ];
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      {...props}
    >
      <rect width="400" height="260" fill="#CFE3E8" />
      <circle cx="330" cy="60" r="24" fill="#F7F1E4" />
      <rect y="150" width="400" height="110" fill="#2E6F8E" />
      <g fill="#5A92AC">
        <rect x="220" y="170" width="80" height="3" rx="1.5" />
        <rect x="300" y="196" width="70" height="3" rx="1.5" />
        <rect x="240" y="226" width="110" height="3" rx="1.5" />
      </g>
      <path d="M0 96 Q60 84 120 100 Q170 116 200 150 L230 260 H0Z" fill="#A7825F" />
      <path d="M0 110 Q60 98 120 112 Q160 124 186 150 L210 260 H0Z" fill="#E9E1D3" />
      {houses.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#FFFFFF" />
          <rect x={x + w * 0.3} y={y + h * 0.35} width={3} height={4} fill="#2B5C9E" />
        </g>
      ))}
      <path d="M60 116 A12 12 0 0 1 84 116Z" fill="#2B5C9E" />
      <path d="M120 150 A10 10 0 0 1 140 150Z" fill="#2B5C9E" />
      <rect x="60" y="116" width="24" height="16" fill="#fff" />
      <rect x="120" y="150" width="20" height="14" fill="#fff" />
    </svg>
  );
}

// --- pyramids (Cairo/Egypt) ---
function PyramidsScene({ className, style, ...props }) {
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      {...props}
    >
      <rect width="400" height="260" fill="#F4D9A6" />
      <circle cx="90" cy="70" r="30" fill="#FBEBCB" />
      <path d="M150 190 L240 80 L330 190Z" fill="#D9A661" />
      <path d="M240 80 L330 190 H260Z" fill="#B9834A" />
      <path d="M60 196 L120 124 L180 196Z" fill="#D9A661" />
      <path d="M120 124 L180 196 H138Z" fill="#B9834A" />
      <path d="M300 200 L335 158 L370 200Z" fill="#D9A661" />
      <path d="M335 158 L370 200 H346Z" fill="#B9834A" />
      <path d="M0 196 Q120 178 220 194 T400 186 V260 H0Z" fill="#E2B877" />
      <path d="M0 230 Q140 214 260 228 T400 222 V260 H0Z" fill="#CF9F5E" />
      <g fill="#6B4A2A">
        <rect x="60" y="214" width="16" height="7" rx="3" />
        <rect x="72" y="208" width="4" height="8" />
        <rect x="62" y="221" width="2" height="8" />
        <rect x="72" y="221" width="2" height="8" />
      </g>
    </svg>
  );
}

// --- mountains (Kazbegi/Georgia) ---
function MountainsScene({ className, style, ...props }) {
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      {...props}
    >
      <rect width="400" height="260" fill="#D8E4E0" />
      <path d="M-20 190 L90 60 L170 150 L250 40 L340 140 L420 90 V260 H-20Z" fill="#7E98A0" />
      <path
        d="M90 60 L112 86 L100 84 L88 96 L74 80Z M250 40 L276 72 L262 68 L248 82 L232 62Z"
        fill="#fff"
      />
      <path d="M-20 210 L60 150 L140 200 L230 130 L320 190 L420 150 V260 H-20Z" fill="#4F6A72" />
      <path d="M0 214 Q110 190 210 208 T400 200 V260 H0Z" fill="#6E8B5A" />
      <path d="M0 240 Q140 226 260 238 T400 232 V260 H0Z" fill="#56733F" />
      <rect x="196" y="176" width="22" height="22" fill="#8C6A4F" />
      <path d="M193 178 L207 162 L221 178Z" fill="#5B4535" />
      <rect x="214" y="166" width="10" height="32" fill="#8C6A4F" />
      <path d="M212 168 L219 150 L226 168Z" fill="#5B4535" />
    </svg>
  );
}

// --- ruins (Athens/Greece) ---
function RuinsScene({ className, style, ...props }) {
  const rows = [0, 1, 2];
  const cols = Array.from({ length: 9 }, (_, i) => i);
  const palms = [20, 370, 386];
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      {...props}
    >
      <rect width="400" height="260" fill="#F0D2B0" />
      <circle cx="320" cy="70" r="28" fill="#F8E6CE" />
      <path d="M40 210 V110 Q200 70 360 110 V210Z" fill="#D6B58C" />
      <path d="M40 110 Q200 70 360 110 V126 Q200 88 40 126Z" fill="#C9A77F" />
      {rows.map((r) =>
        cols.map((i) => (
          <rect
            key={`${r}-${i}`}
            x={56 + i * 34}
            y={132 + r * 26}
            width="16"
            height="18"
            rx="8"
            fill="#9E7B55"
          />
        )),
      )}
      <path d="M300 118 Q340 110 360 110 V210 H300Z" fill="#E9D3B2" opacity="0.6" />
      <path d="M0 206 H400 V260 H0Z" fill="#B9A07A" />
      {palms.map((x) => (
        <ellipse key={x} cx={x} cy="176" rx="9" ry="40" fill="#3E5A3A" />
      ))}
    </svg>
  );
}

/**
 * SceneIllustration — renders the correct destination scene by kind.
 * kind: 'city' | 'balloons' | 'coast' | 'pyramids' | 'mountains' | 'ruins'
 */
export function SceneIllustration({ kind, className, style, ...props }) {
  switch (kind) {
    case 'city':
      return <CityScene className={className} style={style} {...props} />;
    case 'balloons':
      return <BalloonsScene className={className} style={style} {...props} />;
    case 'coast':
      return <CoastScene className={className} style={style} {...props} />;
    case 'pyramids':
      return <PyramidsScene className={className} style={style} {...props} />;
    case 'mountains':
      return <MountainsScene className={className} style={style} {...props} />;
    case 'ruins':
      return <RuinsScene className={className} style={style} {...props} />;
    default:
      return <CityScene className={className} style={style} {...props} />;
  }
}
