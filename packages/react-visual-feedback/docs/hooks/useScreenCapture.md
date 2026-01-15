# useScreenCapture

> **Updated:** 2026-01-16  
> **Related:** [Hooks Overview](./README.md), [ScreenshotService](../services/screenshot-service.md)

## Purpose

Provides screenshot capture functionality with support for full page, element, and area capture.

## Import

```typescript
import { useScreenCapture } from 'react-visual-feedback';
import type { UseScreenCaptureOptions, UseScreenCaptureReturn } from 'react-visual-feedback';
```

## API

### Options

```typescript
interface UseScreenCaptureOptions {
  /** Custom screenshot service (for dependency injection) */
  service?: ScreenshotService;
  
  /** Default capture options */
  defaultOptions?: ScreenshotOptions;
  
  /** Callback after successful capture */
  onCapture?: (result: ScreenshotResult) => void;
  
  /** Callback on capture error */
  onError?: (error: Error) => void;
}
```

### Return Value

```typescript
interface UseScreenCaptureReturn {
  /** Whether a capture is in progress */
  isCapturing: boolean;
  
  /** Captured screenshot data URL */
  screenshot: string | null;
  
  /** Annotated screenshot data URL (after drawing) */
  annotatedScreenshot: string | null;
  
  /** Last capture result */
  captureResult: ScreenshotResult | null;
  
  /** Capture the current screen/page */
  captureScreen: (options?: ScreenshotOptions) => Promise<ScreenshotResult>;
  
  /** Capture a specific element */
  captureElement: (element: HTMLElement, options?: ScreenshotOptions) => Promise<ScreenshotResult>;
  
  /** Capture a specific area */
  captureArea: (area: SelectionArea, options?: ScreenshotOptions) => Promise<ScreenshotResult>;
  
  /** Crop an existing screenshot */
  cropScreenshot: (selection: SelectionArea) => Promise<string>;
  
  /** Set the annotated screenshot */
  setAnnotatedScreenshot: (dataUrl: string) => void;
  
  /** Clear captured screenshots */
  clearScreenshots: () => void;
  
  /** Whether screenshot capture is supported */
  isSupported: boolean;
}
```

## Usage

### Basic Screenshot

```tsx
import { useScreenCapture } from 'react-visual-feedback';

function ScreenshotButton() {
  const { 
    isCapturing, 
    screenshot, 
    captureScreen, 
    clearScreenshots,
  } = useScreenCapture();

  const handleCapture = async () => {
    const result = await captureScreen();
    if (result.success) {
      console.log('Captured:', result.width, 'x', result.height);
    }
  };

  return (
    <div>
      <button onClick={handleCapture} disabled={isCapturing}>
        {isCapturing ? 'Capturing...' : 'Take Screenshot'}
      </button>
      
      {screenshot && (
        <div>
          <img src={screenshot} alt="Screenshot" />
          <button onClick={clearScreenshots}>Clear</button>
        </div>
      )}
    </div>
  );
}
```

### Capture Specific Element

```tsx
import { useRef } from 'react';
import { useScreenCapture } from 'react-visual-feedback';

function ElementCapture() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { captureElement, screenshot } = useScreenCapture();

  const handleCapture = async () => {
    if (targetRef.current) {
      await captureElement(targetRef.current, {
        format: 'png',
        scale: 2, // High DPI
      });
    }
  };

  return (
    <div>
      <div ref={targetRef} className="capture-target">
        <h2>This area will be captured</h2>
        <p>Content to capture...</p>
      </div>
      
      <button onClick={handleCapture}>Capture Element</button>
      
      {screenshot && <img src={screenshot} alt="Element screenshot" />}
    </div>
  );
}
```

### Capture with Selection

```tsx
import { useScreenCapture, useElementSelection } from 'react-visual-feedback';

function SelectiveCapture() {
  const { captureArea, screenshot } = useScreenCapture();
  const { 
    isEnabled, 
    enable, 
    disable, 
    selectedElement,
    highlightStyle,
  } = useElementSelection({
    onElementSelect: async (info) => {
      // Capture the selected element's bounding area
      await captureArea(info.rect);
      disable();
    },
  });

  return (
    <div>
      <button onClick={isEnabled ? disable : enable}>
        {isEnabled ? 'Cancel Selection' : 'Select Area to Capture'}
      </button>
      
      {isEnabled && highlightStyle && (
        <div 
          className="selection-highlight"
          style={{
            position: 'fixed',
            border: '2px solid blue',
            pointerEvents: 'none',
            ...highlightStyle,
          }}
        />
      )}
      
      {screenshot && <img src={screenshot} alt="Selected area" />}
    </div>
  );
}
```

### With Annotation

```tsx
import { useScreenCapture } from 'react-visual-feedback';

function AnnotatedScreenshot() {
  const { 
    screenshot, 
    annotatedScreenshot, 
    captureScreen,
    setAnnotatedScreenshot,
  } = useScreenCapture();

  const handleCapture = async () => {
    await captureScreen();
    // Show canvas overlay for annotation...
  };

  const handleAnnotationComplete = (annotatedDataUrl: string) => {
    setAnnotatedScreenshot(annotatedDataUrl);
  };

  // Use annotated version if available, otherwise original
  const finalScreenshot = annotatedScreenshot || screenshot;

  return (
    <div>
      <button onClick={handleCapture}>Capture & Annotate</button>
      
      {screenshot && !annotatedScreenshot && (
        <CanvasOverlay 
          backgroundImage={screenshot}
          onComplete={handleAnnotationComplete}
        />
      )}
      
      {finalScreenshot && (
        <img src={finalScreenshot} alt="Final screenshot" />
      )}
    </div>
  );
}
```

### With Crop

```tsx
import { useScreenCapture } from 'react-visual-feedback';

function CroppableScreenshot() {
  const { screenshot, cropScreenshot, captureScreen } = useScreenCapture();
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleCrop = async (selection: SelectionArea) => {
    if (screenshot) {
      const cropped = await cropScreenshot(selection);
      setCroppedImage(cropped);
    }
  };

  return (
    <div>
      <button onClick={() => captureScreen()}>Capture</button>
      
      {screenshot && (
        <CropTool 
          image={screenshot}
          onCrop={handleCrop}
        />
      )}
      
      {croppedImage && (
        <div>
          <h3>Cropped Result:</h3>
          <img src={croppedImage} alt="Cropped" />
        </div>
      )}
    </div>
  );
}
```

### Different Output Formats

```tsx
import { useScreenCapture } from 'react-visual-feedback';

function FormatOptions() {
  const { captureScreen, screenshot, captureResult } = useScreenCapture();

  const capturePNG = () => captureScreen({ format: 'png' });
  const captureJPEG = () => captureScreen({ format: 'jpeg', quality: 0.8 });
  const captureWebP = () => captureScreen({ format: 'webp', quality: 0.85 });

  return (
    <div>
      <button onClick={capturePNG}>Capture PNG</button>
      <button onClick={captureJPEG}>Capture JPEG</button>
      <button onClick={captureWebP}>Capture WebP</button>
      
      {captureResult && (
        <p>
          Format: {captureResult.mimeType}<br />
          Size: {(captureResult.size! / 1024).toFixed(1)} KB<br />
          Time: {captureResult.captureTime}ms
        </p>
      )}
    </div>
  );
}
```

## Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useScreenCapture, FeedbackProvider, MockScreenshotService } from 'react-visual-feedback';

describe('useScreenCapture', () => {
  const mockScreenshot = new MockScreenshotService();
  
  const wrapper = ({ children }) => (
    <FeedbackProvider services={{ screenshot: mockScreenshot }}>
      {children}
    </FeedbackProvider>
  );

  beforeEach(() => {
    mockScreenshot.reset();
    mockScreenshot.setMockResult({
      success: true,
      dataUrl: 'data:image/png;base64,test123',
      width: 1920,
      height: 1080,
    });
  });

  test('starts with no screenshot', () => {
    const { result } = renderHook(() => useScreenCapture(), { wrapper });
    expect(result.current.screenshot).toBeNull();
    expect(result.current.isCapturing).toBe(false);
  });

  test('captures screenshot', async () => {
    const { result } = renderHook(() => useScreenCapture(), { wrapper });
    
    await act(async () => {
      await result.current.captureScreen();
    });
    
    expect(result.current.screenshot).toBe('data:image/png;base64,test123');
    expect(result.current.captureResult?.success).toBe(true);
  });

  test('clears screenshots', async () => {
    const { result } = renderHook(() => useScreenCapture(), { wrapper });
    
    await act(async () => {
      await result.current.captureScreen();
    });
    
    expect(result.current.screenshot).not.toBeNull();
    
    act(() => {
      result.current.clearScreenshots();
    });
    
    expect(result.current.screenshot).toBeNull();
    expect(result.current.annotatedScreenshot).toBeNull();
  });

  test('sets annotated screenshot', async () => {
    const { result } = renderHook(() => useScreenCapture(), { wrapper });
    
    await act(async () => {
      await result.current.captureScreen();
    });
    
    act(() => {
      result.current.setAnnotatedScreenshot('data:image/png;base64,annotated');
    });
    
    expect(result.current.annotatedScreenshot).toBe('data:image/png;base64,annotated');
  });
});
```

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
