const fs = require('fs');
const data = require('./svgs.json');

function toJsx(svgStr) {
  return svgStr
    .replace(/stroke-width/g, 'strokeWidth')
    .replace(/stroke-dasharray/g, 'strokeDasharray')
    .replace(/stroke-linecap/g, 'strokeLinecap')
    .replace(/stroke-linejoin/g, 'strokeLinejoin')
    .replace(/class=/g, 'className=')
    .replace(/font-family/g, 'fontFamily')
    .replace(/font-size/g, 'fontSize')
    .replace(/font-weight/g, 'fontWeight')
    .replace(/text-anchor/g, 'textAnchor')
    .replace(/opacity=/g, 'fillOpacity=')
    .replace(/aria-hidden="true"/, '{...props} className={className} aria-hidden="true"')
    .replace(/style="[^"]*"/, "style={{ width: '100%', height: 'auto' }}");
}

const component = `
export function RouteIllustration({ kind, className, ...props }) {
  switch (kind) {
    case 'city':
      return (${toJsx(data.city)});
    case 'balloons':
      return (${toJsx(data.balloons)});
    case 'coast':
      return (${toJsx(data.coast)});
    case 'pyramids':
      return (${toJsx(data.pyramids)});
    case 'mountains':
      return (${toJsx(data.mountains)});
    case 'ruins':
      return (${toJsx(data.ruins)});
    default:
      return null;
  }
}
`;

fs.writeFileSync('apps/traveller/src/components/illustrations/RouteIllustration.jsx', component);
