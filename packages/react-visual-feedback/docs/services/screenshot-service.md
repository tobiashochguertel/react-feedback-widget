# ScreenshotService

> **Updated:** 2026-01-16  
> **Related:** [Services Overview](./README.md)

## Purpose

Provides abstraction for capturing screenshots of DOM elements. Uses modern-screenshot library with html2canvas fallback for production, and a mock implementation for testing.

## Interface

```typescript
interface ScreenshotOptions {
  /** Scale factor for the screenshot (1 = 100%) */
  scale?: number;
  /** Background color for transparent areas */
  backgroundColor?: string;
  /** Quality for JPEG output (0-1) */
  quality?: number;
  /** Output format */
  format?: 'png' | 'jpeg' | 'webp';
  /** Whether to include CSS pseudo-elements */
  includePseudoElements?: boolean;
  /** Whether to skip elements with certain selectors */
  skipSelectors?: string[];
  /** Custom CSS to apply before capture */
  customStyles?: string;
  /** Maximum width for the output */
  maxWidth?: number;
  /** Maximum height for the output */
  maxHeight?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

interface SelectionArea {
  /** X coordinate of selection start */
  x: number;
  /** Y coordinate of selection start */
  y: number;
  /** Width of selection */
  width: number;
  /** Height of selection */
  height: number;
}

interface ScreenshotResult {
  /** Success status */
  success: boolean;
  /** Data URL of the screenshot */
  dataUrl?: string;
  /** Screenshot as a Blob */
  blob?: Blob;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** MIME type */
  mimeType?: string;
  /** File size in bytes */
  size?: number;
  /** Error message if failed */
  error?: string;
  /** Time taken to capture in milliseconds */
  captureTime?: number;
}

interface ScreenshotService {
  /** Capture a screenshot of an element */
  capture(element: HTMLElement, options?: ScreenshotOptions): Promise<ScreenshotResult>;
  
  /** Capture the full page */
  capturePage(options?: ScreenshotOptions): Promise<ScreenshotResult>;
  
  /** Capture a specific area of the page */
  captureArea(area: SelectionArea, options?: ScreenshotOptions): Promise<ScreenshotResult>;
  
  /** Crop an existing screenshot to a selection area */
  crop(dataUrl: string, selection: SelectionArea): Promise<string>;
  
  /** Convert a data URL to a Blob */
  dataUrlToBlob(dataUrl: string): Promise<Blob>;
  
  /** Check if screenshot service is available */
  isSupported(): boolean;
  
  /** Get supported output formats */
  getSupportedFormats(): string[];
}
```

## Implementations

### ModernScreenshotService

Production implementation using modern-screenshot library with html2canvas fallback.

```typescript
import { ModernScreenshotService } from 'react-visual-feedback';

const screenshot = new ModernScreenshotService();

// Capture an element
const element = document.getElementById('my-component');
const result = await screenshot.capture(element, {
  format: 'png',
  scale: 2, // High DPI
  backgroundColor: '#ffffff',
});

if (result.success) {
  console.log(`Captured: ${result.width}x${result.height}`);
  console.log(`Size: ${result.size} bytes`);
  console.log(`Time: ${result.captureTime}ms`);
  
  // Use the data URL
  const img = new Image();
  img.src = result.dataUrl;
  
  // Or use the blob
  const file = new File([result.blob], 'screenshot.png', { type: 'image/png' });
}
```

**Capture Full Page**

```typescript
const result = await screenshot.capturePage({
  format: 'jpeg',
  quality: 0.8,
  maxWidth: 1920,
});
```

**Capture Specific Area**

```typescript
const result = await screenshot.captureArea(
  { x: 100, y: 100, width: 500, height: 300 },
  { format: 'png' }
);
```

**Crop Existing Screenshot**

```typescript
const fullPageResult = await screenshot.capturePage();

const croppedDataUrl = await screenshot.crop(
  fullPageResult.dataUrl!,
  { x: 50, y: 50, width: 200, height: 150 }
);
```

**Library Fallback**

The service automatically handles library availability:

1. **First try:** modern-screenshot (domToPng, domToBlob)
2. **Fallback:** html2canvas
3. **Error:** Returns error result if neither available

### MockScreenshotService

Test implementation that returns configurable mock results.

```typescript
import { MockScreenshotService } from 'react-visual-feedback';

const screenshot = new MockScreenshotService();

// Pre-configure mock result
screenshot.setMockResult({
  success: true,
  dataUrl: 'data:image/png;base64,mockdata...',
  width: 800,
  height: 600,
  mimeType: 'image/png',
});

// Use same API
const result = await screenshot.capture(element);
```

**Testing Usage**

```tsx
import { FeedbackProvider, MockScreenshotService } from 'react-visual-feedback';

function TestWrapper({ children }) {
  const screenshot = new MockScreenshotService();
  
  return (
    <FeedbackProvider services={{ screenshot }}>
      {children}
    </FeedbackProvider>
  );
}

test('captures screenshot on feedback submit', async () => {
  const screenshot = new MockScreenshotService();
  const mockDataUrl = 'data:image/png;base64,test123';
  
  screenshot.setMockResult({
    success: true,
    dataUrl: mockDataUrl,
    width: 1920,
    height: 1080,
  });

  const { result } = renderHook(() => useScreenCapture(), {
    wrapper: ({ children }) => (
      <FeedbackProvider services={{ screenshot }}>
        {children}
      </FeedbackProvider>
    ),
  });

  await act(async () => {
    await result.current.captureScreen();
  });

  expect(result.current.screenshot).toBe(mockDataUrl);
});
```

## Usage in FeedbackProvider

```tsx
import { 
  FeedbackProvider, 
  ModernScreenshotService,
  MockScreenshotService,
} from 'react-visual-feedback';

// Production (default)
<FeedbackProvider>
  {children}
</FeedbackProvider>

// Custom screenshot service
<FeedbackProvider
  services={{
    screenshot: new ModernScreenshotService(),
  }}
>
  {children}
</FeedbackProvider>

// Testing
<FeedbackProvider
  services={{
    screenshot: new MockScreenshotService(),
  }}
>
  {children}
</FeedbackProvider>
```

## Screenshot Workflow

### With Element Selection

```typescript
import { useScreenCapture, useElementSelection } from 'react-visual-feedback';

function ScreenshotTool() {
  const { captureScreen, screenshot, isCapturing } = useScreenCapture();
  const { isSelecting, selection, startSelection } = useElementSelection();

  const handleCapture = async () => {
    if (selection) {
      // Capture with crop
      await captureScreen({ selection });
    } else {
      // Capture full page
      await captureScreen();
    }
  };

  return (
    <div>
      <button onClick={() => startSelection()}>Select Area</button>
      <button onClick={handleCapture} disabled={isCapturing}>
        {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
      </button>
      {screenshot && <img src={screenshot} alt="Screenshot" />}
    </div>
  );
}
```

### With Annotations

```typescript
import { useScreenCapture, useActivation } from 'react-visual-feedback';

function FeedbackFlow() {
  const { captureScreen, screenshot, annotatedScreenshot } = useScreenCapture();
  const { currentMode } = useActivation();

  // After screenshot capture, user can draw on canvas overlay
  // The annotated version is available as annotatedScreenshot
  
  const handleSubmit = () => {
    const finalScreenshot = annotatedScreenshot || screenshot;
    submitFeedback({ screenshot: finalScreenshot });
  };

  return (/* ... */);
}
```

## Default Options

```typescript
const DEFAULT_OPTIONS = {
  scale: window.devicePixelRatio || 1,
  backgroundColor: '#ffffff',
  quality: 0.85,           // From SCREENSHOT_SETTINGS.JPEG_QUALITY
  format: 'png',
  includePseudoElements: true,
  timeout: 10000,          // From SCREENSHOT_SETTINGS.TIMEOUT
};
```

## Error Handling

### Capture Failure

```typescript
const result = await screenshot.capture(element);

if (!result.success) {
  console.error('Screenshot failed:', result.error);
  // Show fallback UI or retry
}
```

### Library Not Available

```typescript
if (!screenshot.isSupported()) {
  console.warn('Screenshot library not loaded');
  // Show upload button instead
}
```

### Timeout

```typescript
const result = await screenshot.capture(element, {
  timeout: 5000, // 5 second timeout
});

if (result.error?.includes('timeout')) {
  // Retry with simpler options
  const retryResult = await screenshot.capture(element, {
    includePseudoElements: false,
    skipSelectors: ['.heavy-animation'],
  });
}
```

## Output Formats

| Format | MIME Type    | Best For                  |
|--------|--------------|---------------------------|
| `png`  | `image/png`  | Crisp text, transparency  |
| `jpeg` | `image/jpeg` | Photos, smaller file size |
| `webp` | `image/webp` | Modern browsers, best compression |

```typescript
// High-quality PNG
await screenshot.capture(element, { format: 'png', scale: 2 });

// Compressed JPEG
await screenshot.capture(element, { format: 'jpeg', quality: 0.7 });

// Modern WebP
await screenshot.capture(element, { format: 'webp', quality: 0.85 });
```

## Best Practices

1. **Use PNG for text-heavy** content
2. **Use JPEG for photos** with lower quality for smaller files
3. **Set appropriate scale** for DPI (usually `window.devicePixelRatio`)
4. **Skip heavy elements** that may slow capture
5. **Handle timeout errors** gracefully
6. **Use MockScreenshotService** in tests to avoid DOM rendering

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
