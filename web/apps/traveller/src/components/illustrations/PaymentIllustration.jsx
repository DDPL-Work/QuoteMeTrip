export function PaymentIllustration({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 320 210"
      role="img"
      aria-label="Payment and confirmation illustration"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      className={className}
      {...props}
    >
      <rect width="320" height="210" rx="14" fill="#FFFBF3" />
      <g transform="translate(16,14)">
        <rect width="288" height="46" rx="12" fill="#fff" stroke="#E2DCD1" />
        <rect x="14" y="13" width="120" height="8" rx="4" fill="#C9C1B3" />
        <rect x="14" y="27" width="70" height="10" rx="5" fill="#13291C" />
        <rect x="180" y="12" width="94" height="24" rx="8" fill="#0C4E28" />
        <text
          x="227"
          y="28"
          textAnchor="middle"
          fontFamily="Poppins,sans-serif"
          fontSize="10"
          fontWeight="700"
          fill="#fff"
        >
          Payment link
        </text>
      </g>
      <g transform="translate(16,70)">
        <rect width="288" height="40" rx="12" fill="#DCEBDD" stroke="#9BC3A2" />
        <rect x="14" y="12" width="16" height="16" rx="4" fill="#147D33" />
        <path
          d="M18 20l3 3 6-6"
          stroke="#fff"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="40"
          y="25"
          fontFamily="Poppins,sans-serif"
          fontSize="11"
          fontWeight="700"
          fill="#245A31"
        >
          Deposit paid · contacts unlocked
        </text>
      </g>
      <g transform="translate(16,120)">
        <rect width="288" height="74" rx="12" fill="#0C4E28" />
        <text
          x="14"
          y="22"
          fontFamily="Poppins,sans-serif"
          fontSize="9"
          fontWeight="800"
          fill="#FDBE6A"
        >
          BOOKING CONFIRMATION
        </text>
        <g transform="translate(14,30)">
          <text fontFamily="Poppins,sans-serif" fontSize="9" fontWeight="700" fill="#fff" y="8">
            Day 1
          </text>
          <rect x="34" y="1" width="86" height="7" rx="3.5" fill="#3D7352" />
        </g>
        <g transform="translate(14,44)">
          <text fontFamily="Poppins,sans-serif" fontSize="9" fontWeight="700" fill="#fff" y="8">
            Day 2
          </text>
          <rect x="34" y="1" width="70" height="7" rx="3.5" fill="#3D7352" />
        </g>
        <g transform="translate(14,58)">
          <text fontFamily="Poppins,sans-serif" fontSize="9" fontWeight="700" fill="#fff" y="8">
            Day 3
          </text>
          <rect x="34" y="1" width="94" height="7" rx="3.5" fill="#3D7352" />
        </g>
        <rect x="196" y="44" width="78" height="20" rx="8" fill="#FC7C00" />
        <text
          x="235"
          y="57.5"
          textAnchor="middle"
          fontFamily="Poppins,sans-serif"
          fontSize="9"
          fontWeight="700"
          fill="#13291C"
        >
          Print / PDF
        </text>
      </g>
    </svg>
  );
}
