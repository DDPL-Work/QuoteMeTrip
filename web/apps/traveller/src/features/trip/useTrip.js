// useTrip hook (Phase 4). Separate module so TripContext.jsx only
// exports components (react-refresh).
import { useContext } from 'react';
import { TripContext } from './trip-context.js';

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip() must be used within TripProvider.');
  return ctx;
}
