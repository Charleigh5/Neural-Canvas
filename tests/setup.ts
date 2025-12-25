import '@testing-library/jest-dom';

// Mock IndexedDB for tests
const indexedDB = {
  open: () => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      objectStoreNames: { contains: () => false },
      createObjectStore: () => ({}),
      transaction: () => ({
        objectStore: () => ({
          put: () => ({ onsuccess: null, onerror: null }),
          get: () => ({ onsuccess: null, onerror: null, result: null }),
          delete: () => ({ onsuccess: null, onerror: null }),
          getAll: () => ({ onsuccess: null, onerror: null, result: [] }),
          clear: () => ({}),
        }),
      }),
    },
  }),
};

Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB });

// Mock performance API
if (typeof performance === 'undefined') {
  Object.defineProperty(globalThis, 'performance', {
    value: { now: () => Date.now() },
  });
}
