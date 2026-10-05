import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Custom hook for high-performance 3D pointer tilt interactions.
 * Uses Framer Motion values to avoid React re-renders on mousemove.
 */
export function usePointerTilt({
  maxRotateX = 5,
  maxRotateY = 7,
  stiffness = 300,
  damping = 25,
} = {}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches);
    }
  }, []);

  const mouseX = useMotionValue(0.5); // 0 to 1
  const mouseY = useMotionValue(0.5); // 0 to 1

  // Calculate rotation angles based on cursor position relative to card center
  const rotateXRaw = useTransform(mouseY, [0, 1], [maxRotateX, -maxRotateX]);
  const rotateYRaw = useTransform(mouseX, [0, 1], [-maxRotateY, maxRotateY]);

  const rotateX = useSpring(rotateXRaw, { stiffness, damping });
  const rotateY = useSpring(rotateYRaw, { stiffness, damping });

  const shineX = useTransform(mouseX, [0, 1], ['0%', '100%']);
  const shineY = useTransform(mouseY, [0, 1], ['0%', '100%']);

  const handlePointerMove = useCallback(
    (e) => {
      if (!cardRef.current || isTouch) return;
      const rect = cardRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(Math.max(0, Math.min(1, x)));
      mouseY.set(Math.max(0, Math.min(1, y)));
    },
    [mouseX, mouseY, isTouch],
  );

  const handlePointerEnter = useCallback(() => {
    if (!isTouch) setIsHovered(true);
  }, [isTouch]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  return {
    cardRef,
    rotateX,
    rotateY,
    shineX,
    shineY,
    isHovered,
    isTouch,
    bind: {
      onPointerMove: handlePointerMove,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    },
  };
}

export default usePointerTilt;
