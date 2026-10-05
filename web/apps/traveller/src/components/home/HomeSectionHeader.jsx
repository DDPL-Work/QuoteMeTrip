import React from 'react';
import { MotionReveal } from '../motion/MotionReveal.jsx';

/**
 * HomeSectionHeader Component
 * Renders consistent section headers with title, description, and optional action.
 */
export function HomeSectionHeader({
  title,
  subtitle,
  actionText,
  onActionClick,
  actionHref,
  className = '',
}) {
  return (
    <MotionReveal className={`g-hd ${className}`}>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actionText &&
        (actionHref ? (
          <a className="g-more" href={actionHref}>
            {actionText}
          </a>
        ) : (
          <button className="g-more" type="button" onClick={onActionClick}>
            {actionText}
          </button>
        ))}
    </MotionReveal>
  );
}

export default HomeSectionHeader;
