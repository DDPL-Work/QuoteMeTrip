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
      `radial-gradient(circle 240px at ${x} ${y}, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 80%)`,
  );

  return (
    <MotionComponent
      ref={cardRef}
      className={`tilt-card-wrapper ${className}`}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        position: 'relative',
        ...style,
      }}
      whileHover={disableTilt ? { y: -4 } : { scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      {...bind}
      {...props}
    >
      <motion.div
        className="tilt-card-inner"
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          rotateX: disableTilt ? 0 : rotateX,
          rotateY: disableTilt ? 0 : rotateY,
          transform: disableTilt ? 'none' : `translateZ(${depth}px)`,
          position: 'relative',
          borderRadius: 'inherit',
        }}
      >
        {children}

        {!disableTilt && (
          <motion.div
            className="tilt-card-shine"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              borderRadius: 'inherit',
              zIndex: 10,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.25s ease',
              background: shineBackground,
            }}
          />
        )}
      </motion.div>
    </MotionComponent>
  );
}

export default TiltCard;
