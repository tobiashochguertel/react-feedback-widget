/**
 * SessionRecorder - Handles screen recording with event logging
 *
 * Records browser sessions including:
 * - Screen capture with audio
 * - Console output interception
 * - Network request logging (fetch, XHR)
 * - Storage operations (localStorage, sessionStorage)
 * - IndexedDB operations
 */

import type { RecorderStatus, EventLog } from './types';

// ============================================================================
// Types
// ============================================================================

interface ConsoleOriginals {
  log: typeof console.log;
  warn: typeof console.warn;
  error: typeof console.error;
  info: typeof console.info;
  debug: typeof console.debug;
}

interface RecordingResult {
  videoBlob: Blob | null;
  events: EventLog[];
}

interface DisplayMediaStreamConstraints {
  video: {
    cursor: 'always' | 'motion' | 'never';
    displaySurface: 'browser' | 'monitor' | 'window';
    width: { ideal: number; max: number };
    height: { ideal: number; max: number };
    frameRate: { ideal: number; max: number };
  };
  audio: boolean;
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
}

// ============================================================================
// SessionRecorder Class
// ============================================================================

class SessionRecorder {
  // Recording state
  status: RecorderStatus = 'idle';
  events: EventLog[] = [];
  recordedChunks: Blob[] = [];
  startTime: number | null = null;

  // Media streams
  stream: MediaStream | null = null;
  screenStream: MediaStream | null = null;
  micStream: MediaStream | null = null;
  audioContext: AudioContext | null = null;
  mediaRecorder: MediaRecorder | null = null;

  // Original function references for patching/unpatching
  private originalConsole: ConsoleOriginals | null = null;
  private originalFetch: typeof fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
  private originalLocalStorageSetItem: typeof Storage.prototype.setItem | null = null;
  private originalLocalStorageRemoveItem: typeof Storage.prototype.removeItem | null = null;
  private originalLocalStorageClear: typeof Storage.prototype.clear | null = null;
  private originalSessionStorageSetItem: typeof Storage.prototype.setItem | null = null;
  private originalSessionStorageRemoveItem: typeof Storage.prototype.removeItem | null = null;
  private originalSessionStorageClear: typeof Storage.prototype.clear | null = null;
  private originalIDBOpen: typeof indexedDB.open | null = null;

  // ===================================================================
  // Timestamp Utility
  // ===================================================================

  private _getTimestamp(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  // ===================================================================
  // Safe Stringification
  // ===================================================================

  private _safeStringify(obj: unknown, maxLength = 1000): string | null {
    if (obj === undefined || obj === null) return null;

    try {
      const seen = new WeakSet<object>();
      const result = JSON.stringify(obj, (_key, value: unknown): unknown => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);

          // Handle DOM elements
          if (value instanceof HTMLElement) {
            return `[HTMLElement: ${value.tagName}]`;
          }

          // Handle functions
          if (typeof value === 'function') {
            return '[Function]';
          }
        }
        return value;
      });

      return result.length > maxLength ? result.slice(0, maxLength) + '...' : result;
    } catch {
      return '[Unserializable]';
    }
  }

  // ===================================================================
  // Console Interception
  // ===================================================================

  private _patchConsole(): void {
    const self = this;

    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    const levels = ['log', 'warn', 'error', 'info', 'debug'] as const;

    levels.forEach((level) => {
      const original = this.originalConsole![level];

      console[level] = function (...args: unknown[]): void {
        self.events.push({
          type: 'console',
          level,
          message: args.map((arg) => self._safeStringify(arg)).join(' '),
          timestamp: self._getTimestamp(),
        });
        original.apply(console, args);
      };
    });
  }

  private _unpatchConsole(): void {
    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.info = this.originalConsole.info;
      console.debug = this.originalConsole.debug;
      this.originalConsole = null;
    }
  }

  // ===================================================================
  // Fetch Interception
  // ===================================================================

  private _patchFetch(): void {
    const self = this;
    this.originalFetch = window.fetch;

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      self.events.push({
        type: 'fetch',
        action: 'request',
        url,
        method,
        timestamp: self._getTimestamp(),
      });

      try {
        const response = await self.originalFetch!.call(window, input, init);

        self.events.push({
          type: 'fetch',
          action: 'response',
          url,
          method,
          status: response.status,
          timestamp: self._getTimestamp(),
        });

        return response;
      } catch (error) {
        self.events.push({
          type: 'fetch',
          action: 'error',
          url,
          method,
          error: error instanceof Error ? error.message : String(error),
          timestamp: self._getTimestamp(),
        });
        throw error;
      }
    };
  }

  private _unpatchFetch(): void {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }

  // ===================================================================
  // XHR Interception
  // ===================================================================

  private _patchXHR(): void {
    const self = this;

    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      (this as XMLHttpRequest & { _method: string; _url: string })._method = method;
      (this as XMLHttpRequest & { _method: string; _url: string })._url = url.toString();
      return self.originalXHROpen!.call(this, method, url, async, username, password);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
      const xhr = this as XMLHttpRequest & { _method: string; _url: string };

      self.events.push({
        type: 'xhr',
        action: 'request',
        method: xhr._method,
        url: xhr._url,
        timestamp: self._getTimestamp(),
      });

      const handleLoadEnd = (): void => {
        self.events.push({
          type: 'xhr',
          action: 'response',
          method: xhr._method,
          url: xhr._url,
          status: xhr.status,
          timestamp: self._getTimestamp(),
        });
        xhr.removeEventListener('loadend', handleLoadEnd);
      };

      xhr.addEventListener('loadend', handleLoadEnd);

      return self.originalXHRSend!.call(this, body);
    };
  }

  private _unpatchXHR(): void {
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      this.originalXHROpen = null;
    }
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
      this.originalXHRSend = null;
    }
  }

  // ===================================================================
  // Storage Interception
  // ===================================================================

  private _patchStorage(): void {
    const self = this;

    // Patch localStorage
    this.originalLocalStorageSetItem = localStorage.setItem.bind(localStorage);
    this.originalLocalStorageRemoveItem = localStorage.removeItem.bind(localStorage);
    this.originalLocalStorageClear = localStorage.clear.bind(localStorage);

    localStorage.setItem = function (key: string, value: string): void {
      self.events.push({
        type: 'storage',
        storage: 'localStorage',
        action: 'setItem',
        key,
        value: value.length > 100 ? value.slice(0, 100) + '...' : value,
        timestamp: self._getTimestamp(),
      });
      return self.originalLocalStorageSetItem!(key, value);
    };

    localStorage.removeItem = function (key: string): void {
      self.events.push({
        type: 'storage',
        storage: 'localStorage',
        action: 'removeItem',
        key,
        timestamp: self._getTimestamp(),
      });
      return self.originalLocalStorageRemoveItem!(key);
    };

    localStorage.clear = function (): void {
      self.events.push({
        type: 'storage',
        storage: 'localStorage',
        action: 'clear',
        timestamp: self._getTimestamp(),
      });
      return self.originalLocalStorageClear!();
    };

    // Patch sessionStorage
    this.originalSessionStorageSetItem = sessionStorage.setItem.bind(sessionStorage);
    this.originalSessionStorageRemoveItem = sessionStorage.removeItem.bind(sessionStorage);
    this.originalSessionStorageClear = sessionStorage.clear.bind(sessionStorage);

    sessionStorage.setItem = function (key: string, value: string): void {
      self.events.push({
        type: 'storage',
        storage: 'sessionStorage',
        action: 'setItem',
        key,
        value: value.length > 100 ? value.slice(0, 100) + '...' : value,
        timestamp: self._getTimestamp(),
      });
      return self.originalSessionStorageSetItem!(key, value);
    };

    sessionStorage.removeItem = function (key: string): void {
      self.events.push({
        type: 'storage',
        storage: 'sessionStorage',
        action: 'removeItem',
        key,
        timestamp: self._getTimestamp(),
      });
      return self.originalSessionStorageRemoveItem!(key);
    };

    sessionStorage.clear = function (): void {
      self.events.push({
        type: 'storage',
        storage: 'sessionStorage',
        action: 'clear',
        timestamp: self._getTimestamp(),
      });
      return self.originalSessionStorageClear!();
    };
  }

  private _unpatchStorage(): void {
    if (this.originalLocalStorageSetItem) {
      localStorage.setItem = this.originalLocalStorageSetItem;
      this.originalLocalStorageSetItem = null;
    }
    if (this.originalLocalStorageRemoveItem) {
      localStorage.removeItem = this.originalLocalStorageRemoveItem;
      this.originalLocalStorageRemoveItem = null;
    }
    if (this.originalLocalStorageClear) {
      localStorage.clear = this.originalLocalStorageClear;
      this.originalLocalStorageClear = null;
    }
    if (this.originalSessionStorageSetItem) {
      sessionStorage.setItem = this.originalSessionStorageSetItem;
      this.originalSessionStorageSetItem = null;
    }
    if (this.originalSessionStorageRemoveItem) {
      sessionStorage.removeItem = this.originalSessionStorageRemoveItem;
      this.originalSessionStorageRemoveItem = null;
    }
    if (this.originalSessionStorageClear) {
      sessionStorage.clear = this.originalSessionStorageClear;
      this.originalSessionStorageClear = null;
    }
  }

  // ===================================================================
  // IndexedDB Interception
  // ===================================================================

  private _patchIndexedDB(): void {
    const self = this;
    this.originalIDBOpen = indexedDB.open.bind(indexedDB);

    indexedDB.open = function (
      name: string,
      version?: number
    ): IDBOpenDBRequest {
      self.events.push({
        type: 'indexedDB',
        action: 'open',
        dbName: name,
        version,
        timestamp: self._getTimestamp(),
      });

      const request = self.originalIDBOpen!(name, version);

      request.addEventListener('success', () => {
        const db = request.result;
        self._wrapIDBDatabase(db);
      });

      return request;
    };
  }

  private _wrapIDBDatabase(db: IDBDatabase): void {
    const self = this;
    const originalTransaction = db.transaction.bind(db);

    db.transaction = function (
      storeNames: string | string[],
      mode?: IDBTransactionMode
    ): IDBTransaction {
      self.events.push({
        type: 'indexedDB',
        action: 'transaction',
        dbName: db.name,
        storeNames: Array.isArray(storeNames) ? storeNames : [storeNames],
        mode: mode ?? 'readonly',
        timestamp: self._getTimestamp(),
      });

      const transaction = originalTransaction(storeNames, mode);
      self._wrapIDBTransaction(transaction, db.name);
      return transaction;
    };
  }

  private _wrapIDBTransaction(transaction: IDBTransaction, dbName: string): void {
    const self = this;
    const originalObjectStore = transaction.objectStore.bind(transaction);

    transaction.objectStore = function (name: string): IDBObjectStore {
      const store = originalObjectStore(name);
      self._wrapIDBObjectStore(store, dbName);
      return store;
    };
  }

  private _wrapIDBObjectStore(store: IDBObjectStore, dbName: string): void {
    const self = this;
    const methods = ['add', 'put', 'delete', 'clear'] as const;

    methods.forEach((method) => {
      const original = store[method]?.bind(store);
      if (original) {
        // Type assertion needed due to method overloads in IDBObjectStore
        (store as unknown as Record<string, unknown>)[method] = function (
          ...args: unknown[]
        ): IDBRequest {
          self.events.push({
            type: 'indexedDB',
            action: method,
            dbName,
            storeName: store.name,
            data: method !== 'clear' ? self._safeStringify(args[0], 500) ?? undefined : undefined,
            timestamp: self._getTimestamp(),
          });
          return (original as (...args: unknown[]) => IDBRequest)(...args);
        };
      }
    });
  }

  private _unpatchIndexedDB(): void {
    if (this.originalIDBOpen) {
      indexedDB.open = this.originalIDBOpen;
      this.originalIDBOpen = null;
    }
  }

  // ===================================================================
  // Media Recording
  // ===================================================================

  private async _getStream(): Promise<MediaStream> {
    try {
      // Request screen capture with system audio
      const constraints: DisplayMediaStreamConstraints = {
        video: {
          cursor: 'always',
          displaySurface: 'browser',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
      };

      const screenStream = await navigator.mediaDevices.getDisplayMedia(
        constraints as DisplayMediaStreamOptions
      );

      // Build stream with video immediately
      const finalStream = new MediaStream();
      screenStream.getVideoTracks().forEach((track) => finalStream.addTrack(track));

      // Add system audio if available
      const systemAudioTracks = screenStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        finalStream.addTrack(systemAudioTracks[0]);
      }

      this.stream = finalStream;
      this.screenStream = screenStream;

      // Handle video track ended
      const videoTrack = finalStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => this.stop());
      }

      return this.stream;
    } catch (error) {
      this.status = 'idle';
      throw error;
    }
  }

  async start(): Promise<MediaStream> {
    if (this.status !== 'idle') {
      this._cleanup();
    }

    this.status = 'starting';
    this.events = [];
    this.recordedChunks = [];

    await this._getStream();

    if (!this.stream) {
      this.status = 'idle';
      throw new Error('Failed to acquire a stream to record.');
    }

    // Use simple WebM format - most compatible
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

    const recorderOptions: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000,
    };

    this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);

    this.mediaRecorder.ondataavailable = (event: BlobEvent): void => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstart = (): void => {
      this.status = 'recording';
    };

    this.mediaRecorder.onpause = (): void => {
      this.status = 'paused';
    };

    this.mediaRecorder.onresume = (): void => {
      this.status = 'recording';
    };

    this.mediaRecorder.onerror = (): void => {
      this.status = 'idle';
    };

    this.mediaRecorder.start(1000);
    this.status = 'recording';

    this.startTime = Date.now();
    this._patchConsole();
    this._patchFetch();
    this._patchXHR();
    this._patchStorage();
    this._patchIndexedDB();

    return this.stream;
  }

  pause(): void {
    if (this.mediaRecorder && this.status === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.status === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  stop(): Promise<RecordingResult> {
    this._unpatchConsole();
    this._unpatchFetch();
    this._unpatchXHR();
    this._unpatchStorage();
    this._unpatchIndexedDB();

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        this._cleanup();
        return resolve({ videoBlob: null, events: this.events });
      }

      const mimeType = this.mediaRecorder.mimeType;
      const currentChunks = this.recordedChunks;
      const currentEvents = [...this.events];

      this.mediaRecorder.onstop = (): void => {
        const videoBlob = new Blob(currentChunks, { type: mimeType });
        this._cleanup();
        resolve({ videoBlob, events: currentEvents });
      };

      if (
        this.mediaRecorder.state === 'recording' ||
        this.mediaRecorder.state === 'paused'
      ) {
        this.mediaRecorder.requestData();
        this.mediaRecorder.stop();
      } else {
        const videoBlob = new Blob(currentChunks, { type: mimeType });
        this._cleanup();
        resolve({ videoBlob, events: currentEvents });
      }
    });
  }

  private _cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => { });
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.status = 'idle';
    this.startTime = null;
  }
}

export default new SessionRecorder();
export { SessionRecorder };
export type { RecordingResult };
