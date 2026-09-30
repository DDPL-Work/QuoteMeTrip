// @troublefree/config
//
// Centralizes non-secret, shared frontend configuration values
// (e.g. supported ports, feature flags). Never place secrets,
// database credentials, JWT secrets, payment keys, or AI API keys
// here — this package is bundled into public React apps.

export const APP_PORTS = {
  backend: 5001,
  traveller: 5173,
  agency: 5174,
  admin: 5175,
};
