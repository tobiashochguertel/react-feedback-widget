/**
 * @file ScreenshotViewer Component Tests
 *
 * Unit tests for the ScreenshotViewer component including zoom, pan,
 * annotations, fullscreen, and carousel functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ScreenshotViewer,
  ScreenshotCarousel,
  type Annotation,
} from "../ScreenshotViewer";

// =============================================================================
// Test Fixtures
// =============================================================================

const testSrc = "/test-screenshot.png";
const testAlt = "Test screenshot";

const testAnnotations: Annotation[] = [
  { x: 10, y: 20, type: "highlight", width: 15, height: 10 },
  { x: 50, y: 50, type: "circle", width: 5, height: 5 },
  { x: 75, y: 25, type: "arrow" },
  { x: 30, y: 80, type: "text", text: "Click here" },
];

const testImages = [
  { src: "/screenshot1.png", alt: "First screenshot" },
  { src: "/screenshot2.png", alt: "Second screenshot" },
  { src: "/screenshot3.png", alt: "Third screenshot" },
];

/**
 * Helper function to render component and simulate image load.
 * Many features (zoom controls, annotations) only appear after imageLoaded=true.
 */
function renderWithImageLoad(component: React.ReactElement) {
  const result = render(component);
  const image = screen.getByRole("img");
  fireEvent.load(image);
  return result;
}

// =============================================================================
// ScreenshotViewer Tests
// =============================================================================

describe("ScreenshotViewer", () => {
  describe("rendering", () => {
    it("renders image with correct src and alt", () => {
      render(<ScreenshotViewer src={testSrc} alt={testAlt} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", testSrc);
      expect(image).toHaveAttribute("alt", testAlt);
    });

    it("renders with default alt text when not provided", () => {
      render(<ScreenshotViewer src={testSrc} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "Screenshot");
    });

    it("applies custom className", () => {
      const { container } = render(
        <ScreenshotViewer src={testSrc} className="custom-viewer" />
      );
      expect(container.firstChild).toHaveClass("custom-viewer");
    });

    it("shows loading state initially", () => {
      const { container } = render(<ScreenshotViewer src={testSrc} />);
      // Loading spinner should be visible until image loads
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("hides loading spinner after image loads", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer src={testSrc} />
      );
      // Spinner should be hidden after image loads
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });

    it("shows error state when image fails to load", () => {
      render(<ScreenshotViewer src="/invalid.png" />);

      const image = screen.getByRole("img");
      fireEvent.error(image);

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Zoom Controls Tests
  // ===========================================================================

  describe("zoom controls", () => {
    it("renders zoom controls when zoomable is true and image loaded", () => {
      renderWithImageLoad(<ScreenshotViewer src={testSrc} zoomable />);

      expect(screen.getByLabelText("Zoom in")).toBeInTheDocument();
      expect(screen.getByLabelText("Zoom out")).toBeInTheDocument();
      expect(screen.getByLabelText("Reset zoom")).toBeInTheDocument();
    });

    it("does not render zoom controls when zoomable is false", () => {
      renderWithImageLoad(<ScreenshotViewer src={testSrc} zoomable={false} />);

      expect(screen.queryByLabelText("Zoom in")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Zoom out")).not.toBeInTheDocument();
    });

    it("displays initial zoom level at 100%", () => {
      renderWithImageLoad(<ScreenshotViewer src={testSrc} zoomable />);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("increases zoom when zoom in button is clicked", () => {
      renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable zoomStep={0.25} />
      );

      fireEvent.click(screen.getByLabelText("Zoom in"));
      expect(screen.getByText("125%")).toBeInTheDocument();
    });

    it("decreases zoom when zoom out button is clicked", () => {
      renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable zoomStep={0.25} />
      );

      fireEvent.click(screen.getByLabelText("Zoom out"));
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("resets zoom when reset button is clicked", () => {
      renderWithImageLoad(<ScreenshotViewer src={testSrc} zoomable />);

      // Zoom in first
      fireEvent.click(screen.getByLabelText("Zoom in"));
      fireEvent.click(screen.getByLabelText("Zoom in"));
      expect(screen.getByText("150%")).toBeInTheDocument();

      // Reset
      fireEvent.click(screen.getByLabelText("Reset zoom"));
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("respects maxZoom limit", () => {
      renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable maxZoom={1.5} zoomStep={0.5} />
      );

      // Click zoom in multiple times
      fireEvent.click(screen.getByLabelText("Zoom in"));
      fireEvent.click(screen.getByLabelText("Zoom in"));
      fireEvent.click(screen.getByLabelText("Zoom in"));

      // Should not exceed 150%
      expect(screen.getByText("150%")).toBeInTheDocument();
    });

    it("respects minZoom limit", () => {
      renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable minZoom={0.5} zoomStep={0.5} />
      );

      // Click zoom out multiple times
      fireEvent.click(screen.getByLabelText("Zoom out"));
      fireEvent.click(screen.getByLabelText("Zoom out"));
      fireEvent.click(screen.getByLabelText("Zoom out"));

      // Should not go below 50%
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("calls onZoomChange callback when zoom changes", () => {
      const handleZoomChange = vi.fn();
      renderWithImageLoad(
        <ScreenshotViewer
          src={testSrc}
          zoomable
          zoomStep={0.25}
          onZoomChange={handleZoomChange}
        />
      );

      fireEvent.click(screen.getByLabelText("Zoom in"));
      expect(handleZoomChange).toHaveBeenCalledWith(1.25);
    });
  });

  // ===========================================================================
  // Fullscreen Tests
  // ===========================================================================

  describe("fullscreen", () => {
    it("renders fullscreen button when fullscreenable is true and image loaded", () => {
      renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable fullscreenable />
      );
      expect(screen.getByLabelText("Toggle fullscreen")).toBeInTheDocument();
    });

    it("does not render fullscreen button when fullscreenable is false", () => {
      renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable fullscreenable={false} />
      );
      expect(
        screen.queryByLabelText("Toggle fullscreen")
      ).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Annotations Tests
  // ===========================================================================

  describe("annotations", () => {
    it("renders highlight annotations when image loaded", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer
          src={testSrc}
          annotations={[
            { x: 10, y: 20, type: "highlight", width: 15, height: 10 },
          ]}
        />
      );

      // Highlight annotation should have specific styling
      const annotations = container.querySelectorAll(
        '[style*="position: absolute"]'
      );
      expect(annotations.length).toBeGreaterThan(0);
    });

    it("renders circle annotations when image loaded", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer
          src={testSrc}
          annotations={[{ x: 50, y: 50, type: "circle" }]}
        />
      );

      // Circle annotation should have rounded border (50% for circle)
      // Query for elements with position absolute (annotation overlay)
      const annotations = container.querySelectorAll(
        '[style*="position: absolute"]'
      );
      expect(annotations.length).toBeGreaterThan(0);
    });

    it("renders arrow annotations when image loaded", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer
          src={testSrc}
          annotations={[{ x: 75, y: 25, type: "arrow" }]}
        />
      );

      // Arrow annotation should be an SVG
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders text annotations with content when image loaded", () => {
      renderWithImageLoad(
        <ScreenshotViewer
          src={testSrc}
          annotations={[{ x: 30, y: 80, type: "text", text: "Click here" }]}
        />
      );

      expect(screen.getByText("Click here")).toBeInTheDocument();
    });

    it("renders multiple annotations when image loaded", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer src={testSrc} annotations={testAnnotations} />
      );

      // Check for text annotation
      expect(screen.getByText("Click here")).toBeInTheDocument();

      // Check for SVG (arrow)
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(1);
    });

    it("uses custom annotation color when image loaded", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer
          src={testSrc}
          annotations={[{ x: 10, y: 10, type: "highlight", color: "#00ff00" }]}
        />
      );

      const annotation = container.querySelector('[style*="border"]');
      expect(annotation).toBeInTheDocument();
    });

    it("does not render annotations before image loads", () => {
      render(
        <ScreenshotViewer
          src={testSrc}
          annotations={[{ x: 30, y: 80, type: "text", text: "Click here" }]}
        />
      );

      // Text should not be visible until image loads
      expect(screen.queryByText("Click here")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Keyboard Navigation Tests
  // ===========================================================================

  describe("keyboard navigation", () => {
    it("zooms in with + key when container has focus", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable />
      );

      // Focus the container (keyboard events only work when container has focus)
      const viewerContainer = container.firstChild as HTMLElement;
      viewerContainer.focus();

      fireEvent.keyDown(window, { key: "+" });
      expect(screen.getByText("125%")).toBeInTheDocument();
    });

    it("zooms out with - key when container has focus", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable />
      );

      // Focus the container
      const viewerContainer = container.firstChild as HTMLElement;
      viewerContainer.focus();

      fireEvent.keyDown(window, { key: "-" });
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("resets zoom with 0 key when container has focus", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable />
      );

      // Focus the container
      const viewerContainer = container.firstChild as HTMLElement;
      viewerContainer.focus();

      // First zoom in
      fireEvent.click(screen.getByLabelText("Zoom in"));
      expect(screen.getByText("125%")).toBeInTheDocument();

      // Reset with 0
      fireEvent.keyDown(window, { key: "0" });
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Mouse Wheel Zoom Tests
  // ===========================================================================

  describe("mouse wheel zoom", () => {
    it("zooms in on wheel up", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable />
      );

      fireEvent.wheel(container.firstChild as Element, { deltaY: -100 });
      expect(screen.getByText("125%")).toBeInTheDocument();
    });

    it("zooms out on wheel down", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable />
      );

      fireEvent.wheel(container.firstChild as Element, { deltaY: 100 });
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("does not zoom when zoomable is false", () => {
      const { container } = renderWithImageLoad(
        <ScreenshotViewer src={testSrc} zoomable={false} />
      );

      fireEvent.wheel(container.firstChild as Element, { deltaY: -100 });
      // Should not have zoom controls
      expect(screen.queryByText("125%")).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// ScreenshotCarousel Tests
// =============================================================================

describe("ScreenshotCarousel", () => {
  describe("rendering", () => {
    it("renders first image by default", () => {
      render(<ScreenshotCarousel images={testImages} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", testImages[0].src);
      expect(image).toHaveAttribute("alt", testImages[0].alt);
    });

    it("renders at specified initial index", () => {
      render(<ScreenshotCarousel images={testImages} initialIndex={1} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", testImages[1].src);
    });

    it("renders navigation buttons", () => {
      render(<ScreenshotCarousel images={testImages} />);

      expect(screen.getByLabelText("Previous image")).toBeInTheDocument();
      expect(screen.getByLabelText("Next image")).toBeInTheDocument();
    });

    it("renders image counter", () => {
      render(<ScreenshotCarousel images={testImages} />);
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("navigates to next image on next button click", () => {
      render(<ScreenshotCarousel images={testImages} />);

      fireEvent.click(screen.getByLabelText("Next image"));

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", testImages[1].src);
      expect(screen.getByText("2 / 3")).toBeInTheDocument();
    });

    it("navigates to previous image on prev button click", () => {
      render(<ScreenshotCarousel images={testImages} initialIndex={1} />);

      fireEvent.click(screen.getByLabelText("Previous image"));

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", testImages[0].src);
    });

    it("wraps to first image when at the end", () => {
      render(<ScreenshotCarousel images={testImages} initialIndex={2} />);

      fireEvent.click(screen.getByLabelText("Next image"));

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", testImages[0].src);
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("wraps to last image when at the beginning", () => {
      render(<ScreenshotCarousel images={testImages} initialIndex={0} />);

      fireEvent.click(screen.getByLabelText("Previous image"));

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", testImages[2].src);
    });

    it("calls onImageChange when image changes", () => {
      const handleImageChange = vi.fn();
      render(
        <ScreenshotCarousel
          images={testImages}
          onImageChange={handleImageChange}
        />
      );

      fireEvent.click(screen.getByLabelText("Next image"));
      expect(handleImageChange).toHaveBeenCalledWith(1);
    });
  });

  describe("keyboard navigation", () => {
    it("navigates with ArrowRight key", () => {
      const { container } = render(<ScreenshotCarousel images={testImages} />);

      fireEvent.keyDown(container.firstChild as Element, { key: "ArrowRight" });

      expect(screen.getByText("2 / 3")).toBeInTheDocument();
    });

    it("navigates with ArrowLeft key", () => {
      const { container } = render(
        <ScreenshotCarousel images={testImages} initialIndex={1} />
      );

      fireEvent.keyDown(container.firstChild as Element, { key: "ArrowLeft" });

      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });
  });

  describe("thumbnails", () => {
    it("renders dot indicators for navigation", () => {
      render(<ScreenshotCarousel images={testImages} />);

      // Carousel uses dot indicators instead of thumbnails
      const dotButtons = screen
        .getAllByRole("button")
        .filter((btn) =>
          btn.getAttribute("aria-label")?.includes("Go to image")
        );
      expect(dotButtons.length).toBe(testImages.length);
    });

    it("navigates when dot indicator is clicked", () => {
      render(<ScreenshotCarousel images={testImages} />);

      // Click on third dot indicator
      const dotButtons = screen
        .getAllByRole("button")
        .filter((btn) =>
          btn.getAttribute("aria-label")?.includes("Go to image")
        );

      expect(dotButtons.length).toBe(3);
      fireEvent.click(dotButtons[2]);
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });
  });
});
