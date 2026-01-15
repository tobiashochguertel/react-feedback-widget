# useRecording

> **Updated:** 2026-01-16  
> **Related:** [Hooks Overview](./README.md), [RecorderService](../services/recorder-service.md)

## Purpose

Controls screen recording functionality with start, stop, pause, and resume capabilities.

## Import

```typescript
import { useRecording } from 'react-visual-feedback';
import type { UseRecordingOptions, UseRecordingReturn } from 'react-visual-feedback';
```

## API

### Options

```typescript
interface UseRecordingOptions {
  /** Custom recorder service (for dependency injection) */
  service?: RecorderService;
  
  /** Recording options */
  options?: RecordingOptions;
  
  /** Callback when recording starts */
  onStart?: () => void;
  
  /** Callback when recording stops */
  onStop?: (result: RecordingResult) => void;
  
  /** Callback on recording error */
  onError?: (error: Error) => void;
  
  /** Callback for progress updates */
  onProgress?: (progress: RecordingProgress) => void;
}
```

### Return Value

```typescript
interface UseRecordingReturn {
  /** Whether currently recording */
  isRecording: boolean;
  
  /** Whether recording is paused */
  isPaused: boolean;
  
  /** Current recording state */
  recordingState: RecordingState;
  
  /** Recording duration in milliseconds */
  recordingDuration: number;
  
  /** Recorded video blob (after stop) */
  recordedBlob: Blob | null;
  
  /** Recording result (after stop) */
  recordingResult: RecordingResult | null;
  
  /** Start recording */
  startRecording: (options?: RecordingOptions) => Promise<boolean>;
  
  /** Stop recording */
  stopRecording: () => Promise<RecordingResult>;
  
  /** Pause recording */
  pauseRecording: () => boolean;
  
  /** Resume recording */
  resumeRecording: () => boolean;
  
  /** Cancel recording without saving */
  cancelRecording: () => void;
  
  /** Clear recorded data */
  clearRecording: () => void;
  
  /** Whether recording is supported */
  isSupported: boolean;
  
  /** Supported MIME types */
  supportedMimeTypes: string[];
}
```

## Usage

### Basic Recording

```tsx
import { useRecording } from 'react-visual-feedback';

function RecordButton() {
  const { 
    isRecording, 
    recordingDuration,
    startRecording, 
    stopRecording,
    recordedBlob,
  } = useRecording();

  const handleClick = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result.success) {
        console.log('Recording saved:', result.blob);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div>
      <button onClick={handleClick}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      
      {isRecording && (
        <span>Recording: {Math.floor(recordingDuration / 1000)}s</span>
      )}
      
      {recordedBlob && (
        <video 
          src={URL.createObjectURL(recordedBlob)} 
          controls 
        />
      )}
    </div>
  );
}
```

### With Pause/Resume

```tsx
import { useRecording } from 'react-visual-feedback';

function RecordingControls() {
  const {
    isRecording,
    isPaused,
    recordingState,
    recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useRecording();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return <button onClick={() => startRecording()}>Record</button>;
  }

  return (
    <div className="recording-controls">
      <span className="recording-time">
        {isPaused ? '⏸️' : '🔴'} {formatTime(recordingDuration)}
      </span>
      
      <button onClick={isPaused ? resumeRecording : pauseRecording}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      
      <button onClick={stopRecording}>Stop & Save</button>
      
      <button onClick={cancelRecording}>Cancel</button>
      
      <span className="state">{recordingState}</span>
    </div>
  );
}
```

### With Callbacks

```tsx
import { useRecording } from 'react-visual-feedback';

function RecordingWithCallbacks() {
  const recording = useRecording({
    onStart: () => {
      console.log('Recording started');
      analytics.track('recording_started');
    },
    onStop: (result) => {
      console.log('Recording stopped:', result);
      if (result.success) {
        uploadRecording(result.blob);
      }
    },
    onError: (error) => {
      console.error('Recording error:', error);
      showToast(`Recording failed: ${error.message}`);
    },
    onProgress: (progress) => {
      // Update UI with progress
      setProgress(progress);
    },
  });

  return <RecordingUI {...recording} />;
}
```

### With Custom Options

```tsx
import { useRecording } from 'react-visual-feedback';

function HighQualityRecording() {
  const { startRecording, isSupported } = useRecording();

  const handleStartHQ = () => {
    startRecording({
      width: 1920,
      height: 1080,
      frameRate: 60,
      videoBitsPerSecond: 5000000, // 5 Mbps
      includeAudio: true,
      includeCursor: true,
    });
  };

  const handleStartLQ = () => {
    startRecording({
      width: 1280,
      height: 720,
      frameRate: 24,
      videoBitsPerSecond: 1000000, // 1 Mbps
      includeAudio: false,
    });
  };

  if (!isSupported) {
    return <p>Recording not supported in this browser</p>;
  }

  return (
    <div>
      <button onClick={handleStartHQ}>Record HD</button>
      <button onClick={handleStartLQ}>Record SD</button>
    </div>
  );
}
```

### Browser Support Check

```tsx
import { useRecording } from 'react-visual-feedback';

function RecordingFeature() {
  const { isSupported, supportedMimeTypes } = useRecording();

  if (!isSupported) {
    return (
      <div className="unsupported">
        <p>Screen recording is not supported in your browser.</p>
        <p>Please use Chrome, Edge, or Firefox.</p>
      </div>
    );
  }

  return (
    <div>
      <p>Supported formats: {supportedMimeTypes.join(', ')}</p>
      <RecordingControls />
    </div>
  );
}
```

## Testing

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecording, FeedbackProvider, MockRecorderService } from 'react-visual-feedback';

describe('useRecording', () => {
  const mockRecorder = new MockRecorderService();
  
  const wrapper = ({ children }) => (
    <FeedbackProvider services={{ recorder: mockRecorder }}>
      {children}
    </FeedbackProvider>
  );

  beforeEach(() => {
    mockRecorder.reset();
    mockRecorder.setMockResult({
      success: true,
      blob: new Blob(['test'], { type: 'video/webm' }),
      duration: 5000,
    });
  });

  test('starts not recording', () => {
    const { result } = renderHook(() => useRecording(), { wrapper });
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingState).toBe('idle');
  });

  test('starts and stops recording', async () => {
    const { result } = renderHook(() => useRecording(), { wrapper });
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.isRecording).toBe(true);
    expect(result.current.recordingState).toBe('recording');
    
    await act(async () => {
      await result.current.stopRecording();
    });
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordedBlob).toBeDefined();
  });

  test('pause and resume', async () => {
    const { result } = renderHook(() => useRecording(), { wrapper });
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    act(() => {
      result.current.pauseRecording();
    });
    expect(result.current.isPaused).toBe(true);
    
    act(() => {
      result.current.resumeRecording();
    });
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isRecording).toBe(true);
  });

  test('cancel discards recording', async () => {
    const { result } = renderHook(() => useRecording(), { wrapper });
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    act(() => {
      result.current.cancelRecording();
    });
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordedBlob).toBeNull();
  });
});
```

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
