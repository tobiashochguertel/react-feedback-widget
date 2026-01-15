# RecorderService

> **Updated:** 2026-01-16  
> **Related:** [Services Overview](./README.md)

## Purpose

Provides abstraction for screen/video recording operations. Uses browser's MediaRecorder API for production and an in-memory mock for testing.

## Interface

```typescript
type RecordingState = 'idle' | 'preparing' | 'recording' | 'paused' | 'stopping' | 'completed' | 'error';

interface RecordingOptions {
  /** Video width in pixels */
  width?: number;
  /** Video height in pixels */
  height?: number;
  /** Frame rate (fps) */
  frameRate?: number;
  /** Video bitrate in bits per second */
  videoBitsPerSecond?: number;
  /** Audio bitrate in bits per second */
  audioBitsPerSecond?: number;
  /** MIME type for the recording */
  mimeType?: string;
  /** Whether to include audio */
  includeAudio?: boolean;
  /** Maximum recording duration in milliseconds */
  maxDuration?: number;
  /** Whether to include cursor in recording */
  includeCursor?: boolean;
  /** Whether to include system audio */
  includeSystemAudio?: boolean;
}

interface RecordingResult {
  /** Success status */
  success: boolean;
  /** Recorded video blob */
  blob?: Blob;
  /** Duration in milliseconds */
  duration?: number;
  /** File size in bytes */
  size?: number;
  /** MIME type of the recording */
  mimeType?: string;
  /** Error message if failed */
  error?: string;
  /** Timestamp when recording started */
  startedAt?: number;
  /** Timestamp when recording ended */
  endedAt?: number;
}

interface RecordingProgress {
  /** Current recording duration in milliseconds */
  duration: number;
  /** Estimated file size in bytes */
  estimatedSize: number;
  /** Current state */
  state: RecordingState;
}

interface RecorderService {
  /** Get current recording state */
  readonly state: RecordingState;
  
  /** Check if recording is currently active */
  readonly isRecording: boolean;

  /** Start recording */
  start(options?: RecordingOptions): Promise<boolean>;
  
  /** Stop recording and get the result */
  stop(): Promise<RecordingResult>;
  
  /** Pause recording */
  pause(): boolean;
  
  /** Resume recording */
  resume(): boolean;
  
  /** Cancel recording without saving */
  cancel(): void;
  
  /** Get current recording duration in milliseconds */
  getDuration(): number;
  
  /** Subscribe to recording progress updates */
  onProgress(callback: (progress: RecordingProgress) => void): () => void;
  
  /** Subscribe to state changes */
  onStateChange(callback: (state: RecordingState) => void): () => void;
  
  /** Check if recording is supported in current environment */
  isSupported(): boolean;
  
  /** Get supported MIME types */
  getSupportedMimeTypes(): string[];
  
  /** Clean up resources */
  dispose(): void;
}
```

## Implementations

### MediaRecorderService

Production implementation using browser's MediaRecorder API.

```typescript
import { MediaRecorderService } from 'react-visual-feedback';

const recorder = new MediaRecorderService();

// Check browser support
if (!recorder.isSupported()) {
  console.error('Recording not supported in this browser');
}

// Start recording with options
await recorder.start({
  width: 1920,
  height: 1080,
  frameRate: 30,
  includeAudio: true,
  includeCursor: true,
});

// Monitor progress
const unsubscribe = recorder.onProgress((progress) => {
  console.log(`Recording: ${progress.duration / 1000}s, ~${progress.estimatedSize} bytes`);
});

// Watch state changes
recorder.onStateChange((state) => {
  console.log(`State: ${state}`);
});

// Pause and resume
recorder.pause();
// ... user pauses
recorder.resume();

// Stop and get result
const result = await recorder.stop();
if (result.success) {
  console.log(`Recorded ${result.duration}ms, ${result.size} bytes`);
  
  // Save to video storage
  await videoStorage.save('feedback-123', result.blob!);
}

// Cleanup
unsubscribe();
recorder.dispose();
```

**Recording States**

```
idle → preparing → recording ⟷ paused → stopping → completed
                      ↓
                    error
```

**Supported MIME Types**

The service automatically detects and uses the best available format:

```typescript
const mimeTypes = recorder.getSupportedMimeTypes();
// ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp9', 'video/webm', ...]
```

### MockRecorderService

Test implementation that simulates recording without browser APIs.

```typescript
import { MockRecorderService } from 'react-visual-feedback';

const recorder = new MockRecorderService();

// Pre-configure mock behavior
recorder.setMockResult({
  success: true,
  blob: new Blob(['mock-video-data'], { type: 'video/webm' }),
  duration: 10000,
  mimeType: 'video/webm',
});

// Use same API as MediaRecorderService
await recorder.start();
const result = await recorder.stop();
```

**Testing Usage**

```tsx
import { FeedbackProvider, MockRecorderService } from 'react-visual-feedback';

function TestWrapper({ children }) {
  const recorder = new MockRecorderService();
  
  return (
    <FeedbackProvider services={{ recorder }}>
      {children}
    </FeedbackProvider>
  );
}

test('handles recording flow', async () => {
  const recorder = new MockRecorderService();
  recorder.setMockResult({
    success: true,
    blob: new Blob(['test'], { type: 'video/webm' }),
    duration: 5000,
  });

  const { result } = renderHook(() => useRecording(), {
    wrapper: ({ children }) => (
      <FeedbackProvider services={{ recorder }}>
        {children}
      </FeedbackProvider>
    ),
  });

  await act(async () => {
    await result.current.startRecording();
  });

  expect(result.current.isRecording).toBe(true);

  await act(async () => {
    await result.current.stopRecording();
  });

  expect(result.current.recordedBlob).toBeDefined();
});
```

## Usage in FeedbackProvider

```tsx
import { 
  FeedbackProvider, 
  MediaRecorderService,
  MockRecorderService,
} from 'react-visual-feedback';

// Production (default)
<FeedbackProvider>
  {children}
</FeedbackProvider>

// Custom recorder options
<FeedbackProvider
  services={{
    recorder: new MediaRecorderService(),
  }}
>
  {children}
</FeedbackProvider>

// Testing
<FeedbackProvider
  services={{
    recorder: new MockRecorderService(),
  }}
>
  {children}
</FeedbackProvider>
```

## Recording Workflow

### Basic Recording Flow

```typescript
import { useRecording } from 'react-visual-feedback';

function RecordButton() {
  const { 
    isRecording, 
    recordingState,
    recordingDuration,
    startRecording, 
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useRecording();

  if (isRecording) {
    return (
      <div>
        <span>Recording: {Math.floor(recordingDuration / 1000)}s</span>
        <button onClick={pauseRecording}>Pause</button>
        <button onClick={stopRecording}>Stop</button>
      </div>
    );
  }

  return <button onClick={startRecording}>Start Recording</button>;
}
```

### With Maximum Duration

```typescript
await recorder.start({
  maxDuration: 60000, // 1 minute max
});

// Recorder will automatically stop after maxDuration
```

### With Audio

```typescript
await recorder.start({
  includeAudio: true,
  includeSystemAudio: true, // Include system audio (browser support varies)
});
```

## Error Handling

### Permission Denied

```typescript
try {
  const success = await recorder.start();
  if (!success) {
    console.error('Recording failed to start');
  }
} catch (error) {
  if (error.name === 'NotAllowedError') {
    console.error('User denied screen sharing permission');
  }
}
```

### Recording Cancelled by User

```typescript
recorder.onStateChange((state) => {
  if (state === 'idle') {
    // User cancelled screen sharing
    console.log('Recording cancelled');
  }
});
```

### Unsupported Browser

```typescript
import { isBrowserEnvironment, checkBrowserApiAvailability } from 'react-visual-feedback';

if (isBrowserEnvironment()) {
  const { mediaRecorder, displayMedia } = checkBrowserApiAvailability();
  
  if (!mediaRecorder || !displayMedia) {
    console.warn('Recording not supported');
    // Hide recording button or show message
  }
}
```

## Default Recording Options

```typescript
const DEFAULT_OPTIONS = {
  width: 1920,               // From VIDEO_DIMENSIONS.WIDTH
  height: 1080,              // From VIDEO_DIMENSIONS.HEIGHT  
  frameRate: 30,             // From RECORDING_QUALITY.FRAME_RATE
  videoBitsPerSecond: 2500000, // From RECORDING_QUALITY.VIDEO_BITRATE
  mimeType: 'video/webm;codecs=vp9',
  includeAudio: false,
  includeCursor: true,
};
```

## Best Practices

1. **Check browser support** before showing record button
2. **Set maxDuration** to prevent excessive file sizes
3. **Monitor progress** to show recording duration
4. **Handle user cancellation** (stream ended events)
5. **Use MockRecorderService** in tests
6. **Dispose recorder** when unmounting

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
