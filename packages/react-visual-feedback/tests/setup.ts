/**
 * Vitest test setup file.
 *
 * This file runs before all tests and sets up the testing environment.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Clean up after each test to ensure DOM is reset.
 */
afterEach(() => {
  cleanup();
});

// =============================================================================
// BROWSER API MOCKS
// =============================================================================

/**
 * Mock matchMedia for styled-components and responsive tests.
 */
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

/**
 * Mock ResizeObserver for components that use it.
 */
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

/**
 * Mock IntersectionObserver for lazy loading components.
 */
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

/**
 * Mock URL.createObjectURL and URL.revokeObjectURL for blob handling.
 */
beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

/**
 * Mock navigator.clipboard for copy functionality.
 */
beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
  });
});

/**
 * Mock navigator.mediaDevices for screen recording tests.
 */
beforeAll(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getDisplayMedia: vi.fn().mockResolvedValue({
        getTracks: () => [
          {
            stop: vi.fn(),
            getSettings: () => ({ width: 1920, height: 1080 }),
          },
        ],
      }),
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
    writable: true,
  });
});

/**
 * Mock MediaRecorder for screen recording tests.
 */
beforeAll(() => {
  global.MediaRecorder = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    ondataavailable: null,
    onstop: null,
    state: 'inactive',
  })) as unknown as typeof MediaRecorder;

  (global.MediaRecorder as unknown as { isTypeSupported: (type: string) => boolean }).isTypeSupported = vi.fn(() => true);
});

/**
 * Mock IndexedDB for recording storage tests.
 */
beforeAll(() => {
  const mockObjectStore = {
    put: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
    get: vi.fn().mockReturnValue({ onsuccess: null, onerror: null, result: null }),
    delete: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
    getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null, result: [] }),
    clear: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
  };

  const mockTransaction = {
    objectStore: vi.fn(() => mockObjectStore),
    oncomplete: null,
    onerror: null,
  };

  const mockDB = {
    transaction: vi.fn(() => mockTransaction),
    createObjectStore: vi.fn(),
    objectStoreNames: { contains: vi.fn(() => true) },
  };

  global.indexedDB = {
    open: vi.fn().mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB,
    }),
    deleteDatabase: vi.fn(),
  } as unknown as IDBFactory;
});

/**
 * Mock html2canvas for screenshot tests.
 */
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,mockImageData',
    toBlob: (callback: (blob: Blob) => void) => callback(new Blob(['mock'], { type: 'image/png' })),
    width: 1920,
    height: 1080,
  }),
}));

/**
 * Mock fetch for API tests.
 */
beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  });
});

// =============================================================================
// CONSOLE SUPPRESSION (Optional)
// =============================================================================

/**
 * Suppress console.error for expected error conditions in tests.
 * Comment out to see all console output during debugging.
 */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React act() warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});
