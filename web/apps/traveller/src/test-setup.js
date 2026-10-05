import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = IntersectionObserver;
  if (typeof globalThis !== 'undefined') {
    globalThis.IntersectionObserver = IntersectionObserver;
  }
}
