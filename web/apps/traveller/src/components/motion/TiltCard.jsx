import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { usePointerTilt } from '../../motion/usePointerTilt.js';

/**
 * TiltCard Component
 * Wraps content in a 3D perspective container that tilts toward the user's cursor.
 * Features:
 * - Real 3D pointer tracking (rotateX & rotateY)
 * - Cursor-following subtle radial shine highlight
 * - Smooth spring reset on mouse leave
 * - Reduced-motion and mobile/touch fallbacks
 */
export function TiltCard({
  children,
  className = '',
  style = {},
  maxRotateX = 5,
  maxRotateY = 7,
  depth = 12,
  showShine = false,
  onClick,
  as: Component = 'div',
  ...props
}) {
  const MotionComponent =
    typeof Component === 'string' ? motion[Component] || motion.div : Component;
  const shouldReduceMotion = useReducedMotion();
  const { cardRef, rotateX, rotateY, shineX, shineY, isHovered, isTouch, bind } = usePointerTilt({
    maxRotateX,
    maxRotateY,
  });

  const disableTilt = shouldReduceMotion || isTouch;

  // Background radial shine that tracks pointer position
  const shineBackground = useTransform(
    [shineX, shineY],
    ([x, y]) =>
      `radial-gradient(circle 240px at ${x} ${y}, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 80%)`,
  );

  const { onPointerEnter, onPointerLeave, onPointerMove, ...restProps } = props;

  const handlePointerEnter = (e) => {
    bind.onPointerEnter(e);
    if (onPointerEnter) onPointerEnter(e);
  };

  const handlePointerLeave = (e) => {
    bind.onPointerLeave(e);
    if (onPointerLeave) onPointerLeave(e);
  };

  const handlePointerMove = (e) => {
    bind.onPointerMove(e);
    if (onPointerMove) onPointerMove(e);
  };

  return (
    <MotionComponent
      ref={cardRef}
      className={`tilt-card-wrapper ${className}`}
      style={{
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
        position: 'relative',
        rotateX: disableTilt ? 0 : rotateX,
        rotateY: disableTilt ? 0 : rotateY,
        ...style,
      }}
      whileHover={disableTilt ? { y: -4 } : { scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      {...restProps}
    >
      {children}

      {!disableTilt && showShine && (
        <motion.div
          className="tilt-card-shine"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            zIndex: 1,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.25s ease',
            background: shineBackground,
          }}
        />
      )}
    </MotionComponent>
  );
}

export default TiltCard;
