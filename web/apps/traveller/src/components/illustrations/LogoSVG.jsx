/**
 * LogoSVG — the QuoteMeTrip / Troublefree Holiday logo extracted
 * from the reference HTML. Renders the PNG logo embedded as an img tag.
 */
import logoSrc from '../../assets/logo.png';

export function LogoSVG({ height = 40, className, style }) {
  return (
    <img
      src={logoSrc}
      alt="Troublefree Holiday"
      height={height}
      className={className}
      style={{ display: 'block', ...style }}
    />
  );
}
