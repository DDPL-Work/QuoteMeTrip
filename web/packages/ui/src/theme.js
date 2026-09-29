// @troublefree/ui — design tokens (Phase 6, traveller-first).
//
// Light-green primary family, yellow secondary family, white /
// light-neutral surfaces, dark charcoal text. Status colors stay
// semantic (success green, warning amber, danger red) so badges read
// consistently across the Traveller, Agency, and Admin apps.

export const THEME = {
  colors: {
    primary: '#2E9E5B',
    primaryDark: '#237A46',
    primaryLight: '#E4F4EA',
    secondary: '#F5C518',
    secondaryDark: '#C99E0A',
    secondaryLight: '#FDF3D0',
    surface: '#FFFFFF',
    background: '#F4F6F4',
    border: '#DCE3DC',
    text: '#23272B',
    textMuted: '#5B6570',
    success: '#2E9E5B',
    warning: '#B7791F',
    danger: '#B3261E',
  },
  radius: {
    sm: '0.4rem',
    md: '0.75rem',
    lg: '1rem',
  },
  font: {
    family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
};

export const STATUS_BADGE_TONES = {
  active: 'success',
  accepted: 'success',
  submitted: 'info',
  in_progress: 'info',
  quoted: 'info',
  completed: 'neutral',
  draft: 'neutral',
  cancelled: 'danger',
  rejected: 'danger',
  withdrawn: 'neutral',
  expired: 'warning',
  closed: 'neutral',
  matched: 'info',
  viewed: 'info',
};
