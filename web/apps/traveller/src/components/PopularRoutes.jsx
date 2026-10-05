import React from 'react';
import { PopularRoutesSection, DEFAULT_POPULAR_ROUTES } from './home/PopularRoutesSection.jsx';

export { DEFAULT_POPULAR_ROUTES };

export function PopularRoutes(props) {
  return <PopularRoutesSection {...props} />;
}

export default PopularRoutes;
