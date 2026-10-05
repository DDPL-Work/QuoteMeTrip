export function RouteIllustration({ kind, className, ...props }) {
  switch (kind) {
    case 'city':
      return (
        <svg
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          {...props}
          className={className}
          aria-hidden="true"
          style={{ width: '100%', height: 'auto' }}
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
    case 'balloons':
      return (
        <svg
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          {...props}
          className={className}
          aria-hidden="true"
          style={{ width: '100%', height: 'auto' }}
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
          <ellipse cx="90" cy="70" rx="26" ry="29.9" fill="#A85F00" />
          <path d="M71.8 90.8 L84.8 110.30000000000001 H95.2 L108.2 90.8Z" fill="#A85F00" />
          <rect x="84.28" y="111.6" width="11.44" height="9.1" fill="#5A3B2A" />
          <rect x="89" y="40.1" width="2" height="59.8" fill="rgba(255,255,255,.25)" />
          <ellipse cx="205" cy="52" rx="32" ry="36.8" fill="#147D33" />
          <path d="M182.6 77.6 L198.6 101.6 H211.4 L227.4 77.6Z" fill="#147D33" />
          <rect x="197.96" y="103.2" width="14.08" height="11.2" fill="#5A3B2A" />
          <rect
            x="204"
            y="15.200000000000003"
            width="2"
            height="73.6"
            fill="rgba(255,255,255,.25)"
          />
          <ellipse cx="310" cy="86" rx="22" ry="25.299999999999997" fill="#E0A43B" />
          <path d="M294.6 103.6 L305.6 120.1 H314.4 L325.4 103.6Z" fill="#E0A43B" />
          <rect x="305.16" y="121.2" width="9.68" height="7.699999999999999" fill="#5A3B2A" />
          <rect
            x="309"
            y="60.7"
            width="2"
            height="50.599999999999994"
            fill="rgba(255,255,255,.25)"
          />
          <ellipse cx="160" cy="118" rx="15" ry="17.25" fill="#8A3517" />
          <path d="M149.5 130 L157 141.25 H163 L170.5 130Z" fill="#8A3517" />
          <rect x="156.7" y="142" width="6.6" height="5.25" fill="#5A3B2A" />
          <rect x="159" y="100.75" width="2" height="34.5" fill="rgba(255,255,255,.25)" />
          <ellipse cx="365" cy="40" rx="14" ry="16.099999999999998" fill="#A85F00" />
          <path d="M355.2 51.2 L362.2 61.7 H367.8 L374.8 51.2Z" fill="#A85F00" />
          <rect
            x="361.92"
            y="62.400000000000006"
            width="6.16"
            height="4.8999999999999995"
            fill="#5A3B2A"
          />
          <rect
            x="364"
            y="23.900000000000002"
            width="2"
            height="32.199999999999996"
            fill="rgba(255,255,255,.25)"
          />
          <ellipse cx="40" cy="40" rx="12" ry="13.799999999999999" fill="#147D33" />
          <path d="M31.6 49.6 L37.6 58.6 H42.4 L48.4 49.6Z" fill="#147D33" />
          <rect x="37.36" y="59.2" width="5.28" height="4.199999999999999" fill="#5A3B2A" />
          <rect
            x="39"
            y="26.200000000000003"
            width="2"
            height="27.599999999999998"
            fill="rgba(255,255,255,.25)"
          />
        </svg>
      );
    case 'coast':
      return (
        <svg
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          {...props}
          className={className}
          aria-hidden="true"
          style={{ width: '100%', height: 'auto' }}
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
          <rect
            x="83"
            y="179"
            width="15.616649519890261"
            height="12.4397719478738"
            fill="#FFFFFF"
          />
          <rect x="87.68499485596708" y="183.35392018175583" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="75"
            y="172"
            width="15.099811385459533"
            height="18.788708847736626"
            fill="#FFFFFF"
          />
          <rect x="79.52994341563786" y="178.5760480967078" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="100"
            y="161"
            width="17.982150205761318"
            height="17.812542866941016"
            fill="#FFFFFF"
          />
          <rect x="105.3946450617284" y="167.23439000342935" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="84"
            y="140"
            width="23.407510288065843"
            height="11.579775377229081"
            fill="#FFFFFF"
          />
          <rect x="91.02225308641975" y="144.05292138203018" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="95"
            y="170"
            width="16.466803840877915"
            height="10.500728737997257"
            fill="#FFFFFF"
          />
          <rect x="99.94004115226338" y="173.67525505829903" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="159"
            y="228"
            width="15.690706447187928"
            height="14.442258230452675"
            fill="#FFFFFF"
          />
          <rect x="163.7072119341564" y="233.05479038065843" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="71"
            y="178"
            width="23.40618998628258"
            height="12.808256172839506"
            fill="#FFFFFF"
          />
          <rect x="78.02185699588478" y="182.48288966049384" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="28"
            y="230"
            width="20.23914609053498"
            height="12.325917352537722"
            fill="#FFFFFF"
          />
          <rect x="34.071743827160496" y="234.3140710733882" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="92"
            y="151"
            width="16.150291495198903"
            height="17.72835219478738"
            fill="#FFFFFF"
          />
          <rect x="96.84508744855967" y="157.20492326817558" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="59"
            y="154"
            width="15.114934842249657"
            height="19.26247427983539"
            fill="#FFFFFF"
          />
          <rect x="63.5344804526749" y="160.7418659979424" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="40"
            y="218"
            width="20.58986625514403"
            height="12.360382373113854"
            fill="#FFFFFF"
          />
          <rect x="46.17695987654321" y="222.32613383058984" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="102"
            y="160"
            width="24.624468449931413"
            height="16.528249314128942"
            fill="#FFFFFF"
          />
          <rect x="109.38734053497943" y="165.78488725994512" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="23"
            y="138"
            width="20.305161179698217"
            height="10.901877572016462"
            fill="#FFFFFF"
          />
          <rect x="29.091548353909467" y="141.81565715020577" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="8"
            y="161"
            width="23.533179012345677"
            height="16.468921467764062"
            fill="#FFFFFF"
          />
          <rect x="15.059953703703702" y="166.7641225137174" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="74"
            y="171"
            width="20.14372427983539"
            height="18.384302126200275"
            fill="#FFFFFF"
          />
          <rect x="80.04311728395062" y="177.4345057441701" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="76"
            y="164"
            width="17.69684499314129"
            height="12.366983882030178"
            fill="#FFFFFF"
          />
          <rect x="81.30905349794239" y="168.32844435871056" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="45"
            y="203"
            width="26.01726680384088"
            height="19.683599108367627"
            fill="#FFFFFF"
          />
          <rect x="52.80518004115226" y="209.88925968792867" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="157"
            y="215"
            width="24.463391632373114"
            height="16.402906378600825"
            fill="#FFFFFF"
          />
          <rect x="164.33901748971192" y="220.7410172325103" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="55"
            y="154"
            width="17.012208504801098"
            height="13.935570987654321"
            fill="#FFFFFF"
          />
          <rect x="60.10366255144033" y="158.87744984567902" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="116"
            y="200"
            width="17.734053497942387"
            height="19.564343278463646"
            fill="#FFFFFF"
          />
          <rect x="121.32021604938272" y="206.84752014746226" width="3" height="4" fill="#2B5C9E" />
          <rect
            x="1"
            y="155"
            width="22.200754458161867"
            height="14.41122256515775"
            fill="#FFFFFF"
          />
          <rect x="7.66022633744856" y="160.04392789780522" width="3" height="4" fill="#2B5C9E" />
          <path d="M60 116 A12 12 0 0 1 84 116Z" fill="#2B5C9E" />
          <path d="M120 150 A10 10 0 0 1 140 150Z" fill="#2B5C9E" />
          <rect x="60" y="116" width="24" height="16" fill="#fff" />
          <rect x="120" y="150" width="20" height="14" fill="#fff" />
        </svg>
      );
    case 'pyramids':
      return (
        <svg
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          {...props}
          className={className}
          aria-hidden="true"
          style={{ width: '100%', height: 'auto' }}
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
    case 'mountains':
      return (
        <svg
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          {...props}
          className={className}
          aria-hidden="true"
          style={{ width: '100%', height: 'auto' }}
        >
          <rect width="400" height="260" fill="#D8E4E0" />
          <path d="M-20 190 L90 60 L170 150 L250 40 L340 140 L420 90 V260 H-20Z" fill="#7E98A0" />
          <path
            d="M90 60 L112 86 L100 84 L88 96 L74 80Z M250 40 L276 72 L262 68 L248 82 L232 62Z"
            fill="#fff"
          />
          <path
            d="M-20 210 L60 150 L140 200 L230 130 L320 190 L420 150 V260 H-20Z"
            fill="#4F6A72"
          />
          <path d="M0 214 Q110 190 210 208 T400 200 V260 H0Z" fill="#6E8B5A" />
          <path d="M0 240 Q140 226 260 238 T400 232 V260 H0Z" fill="#56733F" />
          <g>
            <rect x="196" y="176" width="22" height="22" fill="#8C6A4F" />
            <path d="M193 178 L207 162 L221 178Z" fill="#5B4535" />
            <rect x="214" y="166" width="10" height="32" fill="#8C6A4F" />
            <path d="M212 168 L219 150 L226 168Z" fill="#5B4535" />
          </g>
        </svg>
      );
    case 'ruins':
      return (
        <svg
          viewBox="0 0 400 260"
          preserveAspectRatio="xMidYMid slice"
          {...props}
          className={className}
          aria-hidden="true"
          style={{ width: '100%', height: 'auto' }}
        >
          <rect width="400" height="260" fill="#F0D2B0" />
          <circle cx="320" cy="70" r="28" fill="#F8E6CE" />
          <path d="M40 210 V110 Q200 70 360 110 V210Z" fill="#D6B58C" />
          <path d="M40 110 Q200 70 360 110 V126 Q200 88 40 126Z" fill="#C9A77F" />
          <rect x="56" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="90" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="124" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="158" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="192" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="226" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="260" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="294" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="328" y="132" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="56" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="90" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="124" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="158" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="192" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="226" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="260" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="294" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="328" y="158" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="56" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="90" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="124" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="158" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="192" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="226" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="260" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="294" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <rect x="328" y="184" width="16" height="18" rx="8" fill="#9E7B55" />
          <path d="M300 118 Q340 110 360 110 V210 H300Z" fill="#E9D3B2" fillOpacity=".6" />
          <path d="M0 206 H400 V260 H0Z" fill="#B9A07A" />
          <ellipse cx="20" cy="176" rx="9" ry="40" fill="#3E5A3A" />
          <ellipse cx="370" cy="176" rx="9" ry="40" fill="#3E5A3A" />
          <ellipse cx="386" cy="176" rx="9" ry="40" fill="#3E5A3A" />
        </svg>
      );
    default:
      return null;
  }
}
