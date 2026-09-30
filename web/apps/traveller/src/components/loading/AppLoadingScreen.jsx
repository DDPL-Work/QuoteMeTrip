import React from 'react';
import { AppPreloader } from './AppPreloader.jsx';

export { AppPreloader };

export function AppLoadingScreen(props) {
  return <AppPreloader {...props} />;
}

export default AppLoadingScreen;
