export function ItineraryIllustration({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 320 210"
      role="img"
      aria-label="Itinerary builder illustration"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      className={className}
      {...props}
    >
      <rect width="320" height="210" rx="14" fill="#FFFBF3" />
      <rect x="16" y="14" width="120" height="10" rx="5" fill="#0C4E28" />
      <g transform="translate(16,38)">
        <rect width="288" height="44" rx="10" fill="#fff" stroke="#E2DCD1" />
        <text
          x="12"
          y="27"
          fontFamily="Poppins,sans-serif"
          fontSize="15"
          fontWeight="700"
          fill="#FC7C00"
        >
          1
        </text>
        <rect x="30" y="13" width="54" height="8" rx="4" fill="#C9C1B3" />
        <rect x="94" y="13" width="72" height="8" rx="4" fill="#13291C" />
        <rect x="176" y="10" width="34" height="15" rx="7.5" fill="#147D33" />
        <rect x="216" y="10" width="28" height="15" rx="7.5" fill="#147D33" />
        <rect x="250" y="10" width="28" height="15" rx="7.5" fill="#147D33" />
      </g>
      <g transform="translate(16,90)">
        <rect width="288" height="44" rx="10" fill="#fff" stroke="#E2DCD1" />
        <text
          x="12"
          y="27"
          fontFamily="Poppins,sans-serif"
          fontSize="15"
          fontWeight="700"
          fill="#FC7C00"
        >
          2
        </text>
        <rect x="30" y="13" width="54" height="8" rx="4" fill="#C9C1B3" />
        <rect x="94" y="13" width="72" height="8" rx="4" fill="#13291C" />
        <rect x="176" y="10" width="34" height="15" rx="7.5" fill="#147D33" />
        <rect x="216" y="10" width="28" height="15" rx="7.5" fill="#E5F2EA" />
        <rect x="250" y="10" width="28" height="15" rx="7.5" fill="#147D33" />
      </g>
      <g transform="translate(16,142)">
        <rect width="288" height="44" rx="10" fill="#fff" stroke="#E2DCD1" />
        <text
          x="12"
          y="27"
          fontFamily="Poppins,sans-serif"
          fontSize="15"
          fontWeight="700"
          fill="#FC7C00"
        >
          3
        </text>
        <rect x="30" y="13" width="54" height="8" rx="4" fill="#C9C1B3" />
        <rect x="94" y="13" width="72" height="8" rx="4" fill="#13291C" />
        <rect x="176" y="10" width="34" height="15" rx="7.5" fill="#E5F2EA" />
        <rect x="216" y="10" width="28" height="15" rx="7.5" fill="#E5F2EA" />
        <rect x="250" y="10" width="28" height="15" rx="7.5" fill="#147D33" />
      </g>
      <rect x="16" y="194" width="288" height="1" fill="#EEE8DE" />
      <g transform="translate(16,166)">
        <rect
          width="288"
          height="26"
          rx="8"
          fill="#fff"
          stroke="#B9AE9C"
          strokeDasharray="4 4"
        />
        <text
          x="144"
          y="17"
          textAnchor="middle"
          fontFamily="Poppins,sans-serif"
          fontSize="11"
          fontWeight="700"
          fill="#13291C"
        >
          + Add day
        </text>
      </g>
    </svg>
  );
}
