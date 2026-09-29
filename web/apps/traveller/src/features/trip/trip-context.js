// Trip context object (Phase 4). Kept in its own module so the
// provider file only exports components (react-refresh).
import { createContext } from 'react';

export const TripContext = createContext(null);
