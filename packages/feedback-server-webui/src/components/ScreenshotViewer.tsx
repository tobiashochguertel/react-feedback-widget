/**
 * @file ScreenshotViewer Component
 *
 * A zoomable, pannable image viewer for feedback screenshots.
 * Supports fullscreen mode, annotations overlay, and carousel navigation.
 *
 * @example
 * <ScreenshotViewer
 *   src="/screenshots/1.png"
 *   alt="Screenshot of login page"
 *   annotations={[{ x: 100, y: 200, type: 'highlight' }]}
 * />
 */

import { useState, useCallback, useRef, useEffect } from "react";

/** Annotation shape */
export interface Annotation {
  /** X position (percentage) */
  x: number;
  /** Y position (percentage) */
  y: number;
  /** Width (percentage) */
  width?: number;
  /** Height (percentage) */
  height?: number;
  /** Annotation type */
  type: "highlight" | "circle" | "arrow" | "text";
  /** Text content (for text annotations) */
  text?: string;
  /** Color */
  color?: string;
}

/** Props for ScreenshotViewer component */
export interface ScreenshotViewerProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt?: string | undefined;
  /** Array of annotations to overlay */
  annotations?: Annotation[] | undefined;
  /** Enable zoom functionality */
  zoomable?: boolean | undefined;
  /** Enable pan functionality */
  pannable?: boolean | undefined;
  /** Enable fullscreen mode */
  fullscreenable?: boolean | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
  /** Max zoom level */
  maxZoom?: number | undefined;
  /** Min zoom level */
  minZoom?: number | undefined;
  /** Zoom step */
  zoomStep?: number | undefined;
  /** Callback when zoom changes */
  onZoomChange?: ((zoom: number) => void) | undefined;
}

/** Props for carousel mode */
export interface ScreenshotCarouselProps extends Omit<ScreenshotViewerProps, "src" | "alt"> {
  /** Array of image sources */
  images: Array<{ src: string; alt?: string; annotations?: Annotation[] }>;
  /** Initial image index */
  initialIndex?: number;
  /** Callback when image changes */
  onImageChange?: (index: number) => void;
}

/**
 * Annotation overlay component
 */
function AnnotationOverlay({ annotation }: { annotation: Annotation }) {
  const color = annotation.color || "#ef4444";

  const baseStyles: React.CSSProperties = {
    position: "absolute",
    left: `${annotation.x}%`,
    top: `${annotation.y}%`,
    pointerEvents: "none",
  };

  switch (annotation.type) {
    case "highlight":
      return (
        <div
          style={{
            ...baseStyles,
            width: `${annotation.width || 10}%`,
            height: `${annotation.height || 10}%`,
            backgroundColor: `${color}33`,
            border: `2px solid ${color}`,
            borderRadius: "4px",
          }}
        />
      );

    case "circle":
      return (
        <div
          style={{
            ...baseStyles,
            width: `${annotation.width || 5}%`,
            height: `${annotation.height || 5}%`,
            border: `3px solid ${color}`,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      );

    case "arrow":
      return (
        <svg
          style={{
            ...baseStyles,
            width: "40px",
            height: "40px",
            transform: "translate(-50%, -50%)",
          }}
          viewBox="0 0 24 24"
          fill={color}
        >
          <path d="M12 2L4 10h6v12h4V10h6z" />
        </svg>
      );

    case "text":
      return (
        <div
          style={{
            ...baseStyles,
            backgroundColor: color,
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 500,
            transform: "translate(-50%, -50%)",
          }}
        >
          {annotation.text}
        </div>
      );

    default:
      return null;
  }
}

/**
 * Zoom controls component
 */
function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFullscreen,
  showFullscreen,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFullscreen?: (() => void) | undefined;
  showFullscreen: boolean;
}) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 z-10">
      <button
        onClick={onZoomOut}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        aria-label="Zoom out"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      <span className="text-sm font-medium min-w-[3rem] text-center">
        {Math.round(zoom * 100)}%
      </span>

      <button
        onClick={onZoomIn}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        aria-label="Zoom in"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

      <button
        onClick={onReset}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
        aria-label="Reset zoom"
      >
        Reset
      </button>

      {showFullscreen && (
        <>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />
          <button
            onClick={onFullscreen}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Toggle fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

/**
 * ScreenshotViewer - Zoomable, pannable image viewer with annotations
 */
export function ScreenshotViewer({
  src,
  alt = "Screenshot",
  annotations = [],
  zoomable = true,
  pannable = true,
  fullscreenable = true,
  className = "",
  maxZoom = 5,
  minZoom = 0.5,
  zoomStep = 0.25,
  onZoomChange,
}: ScreenshotViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle zoom change
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
      setZoom(clampedZoom);
      onZoomChange?.(clampedZoom);
    },
    [minZoom, maxZoom, onZoomChange]
  );

  // Zoom in
  const handleZoomIn = useCallback(() => {
    handleZoomChange(zoom + zoomStep);
  }, [zoom, zoomStep, handleZoomChange]);

  // Zoom out
  const handleZoomOut = useCallback(() => {
    handleZoomChange(zoom - zoomStep);
  }, [zoom, zoomStep, handleZoomChange]);

  // Reset zoom and pan
  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onZoomChange?.(1);
  }, [onZoomChange]);

  // Toggle fullscreen
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!zoomable) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      handleZoomChange(zoom + delta);
    },
    [zoomable, zoom, zoomStep, handleZoomChange]
  );

  // Handle pan start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!pannable || zoom <= 1) return;

      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pannable, zoom, pan]
  );

  // Handle pan move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
          e.preventDefault();
          handleZoomOut();
          break;
        case "0":
          e.preventDefault();
          handleReset();
          break;
        case "f":
          if (fullscreenable) {
            e.preventDefault();
            handleFullscreen();
          }
          break;
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleReset, handleFullscreen, fullscreenable, isFullscreen]);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${isFullscreen ? "fixed inset-0 z-50" : ""} ${className}`}
      tabIndex={0}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: isDragging ? "grabbing" : zoom > 1 && pannable ? "grab" : "default",
      }}
    >
      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Failed to load image</span>
        </div>
      )}

      {/* Image container */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        <img
          src={src}
          alt={alt}
          className={`max-w-full max-h-full object-contain ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          draggable={false}
        />

        {/* Annotations overlay */}
        {imageLoaded && annotations.length > 0 && (
          <div className="absolute inset-0">
            {annotations.map((annotation, index) => (
              <AnnotationOverlay key={index} annotation={annotation} />
            ))}
          </div>
        )}
      </div>

      {/* Zoom controls */}
      {zoomable && imageLoaded && (
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          onFullscreen={fullscreenable ? handleFullscreen : undefined}
          showFullscreen={fullscreenable}
        />
      )}

      {/* Fullscreen close button */}
      {isFullscreen && (
        <button
          onClick={handleFullscreen}
          className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 z-20"
          aria-label="Exit fullscreen"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * ScreenshotCarousel - Image carousel with screenshot viewer
 */
export function ScreenshotCarousel({
  images,
  initialIndex = 0,
  onImageChange,
  ...viewerProps
}: ScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentImage = images[currentIndex];

  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(newIndex);
    onImageChange?.(newIndex);
  }, [currentIndex, images.length, onImageChange]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onImageChange?.(newIndex);
  }, [currentIndex, images.length, onImageChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext]);

  if (!currentImage) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No images available
      </div>
    );
  }

  return (
    <div className="relative">
      <ScreenshotViewer
        src={currentImage.src}
        alt={currentImage.alt}
        annotations={currentImage.annotations}
        {...viewerProps}
      />

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
            aria-label="Previous image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
            aria-label="Next image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Thumbnail navigation */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  onImageChange?.(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ScreenshotViewer;
