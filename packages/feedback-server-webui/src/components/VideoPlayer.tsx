/**
 * VideoPlayer Component
 *
 * A video player component for session recordings with:
 * - Play/pause controls
 * - Progress bar with seek
 * - Volume control
 * - Fullscreen toggle
 * - Playback speed control
 * - Keyboard shortcuts
 *
 * TASK-WUI-013
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';

// ============================================================================
// Types
// ============================================================================

export interface VideoPlayerProps {
  /** Video source URL */
  src: string;
  /** Optional poster image URL */
  poster?: string | undefined;
  /** Video title for accessibility */
  title?: string | undefined;
  /** Whether to autoplay on load */
  autoPlay?: boolean | undefined;
  /** Whether to loop the video */
  loop?: boolean | undefined;
  /** Whether to mute the video by default */
  muted?: boolean | undefined;
  /** Additional CSS class names */
  className?: string | undefined;
  /** Callback when video starts playing */
  onPlay?: (() => void) | undefined;
  /** Callback when video is paused */
  onPause?: (() => void) | undefined;
  /** Callback when video ends */
  onEnded?: (() => void) | undefined;
  /** Callback for time updates */
  onTimeUpdate?: ((currentTime: number) => void) | undefined;
  /** Callback for progress (buffered) */
  onProgress?: ((buffered: number) => void) | undefined;
  /** Callback when duration is available */
  onDurationChange?: ((duration: number) => void) | undefined;
  /** Callback when video is ready to play */
  onCanPlay?: (() => void) | undefined;
  /** Callback for errors */
  onError?: ((error: MediaError | null) => void) | undefined;
  /** Callback for fullscreen change */
  onFullscreenChange?: ((isFullscreen: boolean) => void) | undefined;
  /** Show controls */
  showControls?: boolean | undefined;
  /** Keyboard shortcuts enabled */
  keyboardShortcuts?: boolean | undefined;
}

export interface VideoPlayerRef {
  /** Get the underlying video element */
  getVideoElement: () => HTMLVideoElement | null;
  /** Play the video */
  play: () => Promise<void>;
  /** Pause the video */
  pause: () => void;
  /** Toggle play/pause */
  togglePlay: () => void;
  /** Seek to a specific time in seconds */
  seek: (time: number) => void;
  /** Set playback rate */
  setPlaybackRate: (rate: number) => void;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Toggle mute */
  toggleMute: () => void;
  /** Toggle fullscreen */
  toggleFullscreen: () => void;
  /** Get current time */
  getCurrentTime: () => number;
  /** Get duration */
  getDuration: () => number;
  /** Is playing */
  isPlaying: () => boolean;
  /** Is muted */
  isMuted: () => boolean;
  /** Is fullscreen */
  isFullscreen: () => boolean;
}

// Playback speed options
const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// Icons (inline SVG for no dependencies)
// ============================================================================

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);

const VolumeHighIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeLowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
  </svg>
);

const VolumeMuteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const FullscreenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const FullscreenExitIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  (
    {
      src,
      poster,
      title,
      autoPlay = false,
      loop = false,
      muted = false,
      className = '',
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onProgress,
      onDurationChange,
      onCanPlay,
      onError,
      onFullscreenChange,
      showControls = true,
      keyboardShortcuts = true,
    },
    ref
  ) => {
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(muted);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Control visibility timer
    const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    // ========================================================================
    // Imperative Handle
    // ========================================================================

    useImperativeHandle(ref, () => ({
      getVideoElement: () => videoRef.current,
      play: async () => {
        await videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      togglePlay: () => {
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      },
      seek: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      setPlaybackRate: (rate: number) => {
        if (videoRef.current) {
          videoRef.current.playbackRate = rate;
          setPlaybackRate(rate);
        }
      },
      setVolume: (vol: number) => {
        if (videoRef.current) {
          videoRef.current.volume = Math.max(0, Math.min(1, vol));
          setVolume(videoRef.current.volume);
        }
      },
      toggleMute: () => {
        if (videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted;
          setIsMuted(videoRef.current.muted);
        }
      },
      toggleFullscreen: () => handleToggleFullscreen(),
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      getDuration: () => videoRef.current?.duration ?? 0,
      isPlaying: () => !videoRef.current?.paused,
      isMuted: () => videoRef.current?.muted ?? false,
      isFullscreen: () => isFullscreen,
    }));

    // ========================================================================
    // Control Visibility
    // ========================================================================

    const showControlsTemporarily = useCallback(() => {
      setControlsVisible(true);

      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }

      if (isPlaying && !showSpeedMenu && !showVolumeSlider) {
        hideControlsTimeout.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
    }, [isPlaying, showSpeedMenu, showVolumeSlider]);

    useEffect(() => {
      return () => {
        if (hideControlsTimeout.current) {
          clearTimeout(hideControlsTimeout.current);
        }
      };
    }, []);

    // ========================================================================
    // Video Event Handlers
    // ========================================================================

    const handlePlay = useCallback(() => {
      setIsPlaying(true);
      onPlay?.();
      showControlsTemporarily();
    }, [onPlay, showControlsTemporarily]);

    const handlePause = useCallback(() => {
      setIsPlaying(false);
      setControlsVisible(true);
      onPause?.();
    }, [onPause]);

    const handleEnded = useCallback(() => {
      setIsPlaying(false);
      setControlsVisible(true);
      onEnded?.();
    }, [onEnded]);

    const handleTimeUpdate = useCallback(() => {
      const video = videoRef.current;
      if (video) {
        setCurrentTime(video.currentTime);
        onTimeUpdate?.(video.currentTime);
      }
    }, [onTimeUpdate]);

    const handleProgressUpdate = useCallback(() => {
      const video = videoRef.current;
      if (video && video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
        onProgress?.(bufferedPercent);
      }
    }, [onProgress]);

    const handleDurationChange = useCallback(() => {
      const video = videoRef.current;
      if (video) {
        setDuration(video.duration);
        onDurationChange?.(video.duration);
      }
    }, [onDurationChange]);

    const handleCanPlay = useCallback(() => {
      setIsLoading(false);
      onCanPlay?.();
    }, [onCanPlay]);

    const handleWaiting = useCallback(() => {
      setIsLoading(true);
    }, []);

    const handlePlaying = useCallback(() => {
      setIsLoading(false);
    }, []);

    const handleError = useCallback(() => {
      const video = videoRef.current;
      setHasError(true);
      setIsLoading(false);
      onError?.(video?.error ?? null);
    }, [onError]);

    // ========================================================================
    // Control Handlers
    // ========================================================================

    const handleTogglePlay = useCallback(() => {
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }
    }, []);

    const handleSeek = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
        }
      },
      []
    );

    const handleVolumeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        if (videoRef.current) {
          videoRef.current.volume = vol;
          videoRef.current.muted = vol === 0;
          setVolume(vol);
          setIsMuted(vol === 0);
        }
      },
      []
    );

    const handleToggleMute = useCallback(() => {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
      }
    }, []);

    const handleSpeedChange = useCallback((speed: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = speed;
        setPlaybackRate(speed);
      }
      setShowSpeedMenu(false);
    }, []);

    const handleToggleFullscreen = useCallback(async () => {
      const container = containerRef.current;
      if (!container) return;

      try {
        if (!document.fullscreenElement) {
          await container.requestFullscreen();
          setIsFullscreen(true);
          onFullscreenChange?.(true);
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
          onFullscreenChange?.(false);
        }
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    }, [onFullscreenChange]);

    // ========================================================================
    // Fullscreen Change Listener
    // ========================================================================

    useEffect(() => {
      const handleFullscreenChange = () => {
        const isFs = !!document.fullscreenElement;
        setIsFullscreen(isFs);
        onFullscreenChange?.(isFs);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener(
          'fullscreenchange',
          handleFullscreenChange
        );
      };
    }, [onFullscreenChange]);

    // ========================================================================
    // Keyboard Shortcuts
    // ========================================================================

    useEffect(() => {
      if (!keyboardShortcuts) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        // Only handle if container is focused or contains focus
        if (!containerRef.current?.contains(document.activeElement)) return;

        const video = videoRef.current;
        if (!video) return;

        switch (e.key.toLowerCase()) {
          case ' ':
          case 'k':
            e.preventDefault();
            handleTogglePlay();
            break;
          case 'f':
            e.preventDefault();
            handleToggleFullscreen();
            break;
          case 'm':
            e.preventDefault();
            handleToggleMute();
            break;
          case 'arrowleft':
            e.preventDefault();
            video.currentTime = Math.max(0, video.currentTime - 5);
            break;
          case 'arrowright':
            e.preventDefault();
            video.currentTime = Math.min(video.duration, video.currentTime + 5);
            break;
          case 'arrowup':
            e.preventDefault();
            video.volume = Math.min(1, video.volume + 0.1);
            setVolume(video.volume);
            break;
          case 'arrowdown':
            e.preventDefault();
            video.volume = Math.max(0, video.volume - 0.1);
            setVolume(video.volume);
            break;
          case 'home':
            e.preventDefault();
            video.currentTime = 0;
            break;
          case 'end':
            e.preventDefault();
            video.currentTime = video.duration;
            break;
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            e.preventDefault();
            video.currentTime = (parseInt(e.key) / 10) * video.duration;
            break;
        }

        showControlsTemporarily();
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
      keyboardShortcuts,
      handleTogglePlay,
      handleToggleFullscreen,
      handleToggleMute,
      showControlsTemporarily,
    ]);

    // ========================================================================
    // Render
    // ========================================================================

    const VolumeIcon =
      isMuted || volume === 0
        ? VolumeMuteIcon
        : volume < 0.5
          ? VolumeLowIcon
          : VolumeHighIcon;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden group ${className}`}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setControlsVisible(false)}
        tabIndex={0}
        role="application"
        aria-label={title ? `Video player: ${title}` : 'Video player'}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={isMuted}
          playsInline
          className="w-full h-full object-contain"
          onClick={handleTogglePlay}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgressUpdate}
          onDurationChange={handleDurationChange}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onError={handleError}
        />

        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
            <svg
              className="w-16 h-16 mb-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">Error loading video</p>
            <p className="text-sm text-gray-400 mt-1">
              Please check the video source
            </p>
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && !hasError && (
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-16 pb-4 px-4 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'
              }`}
          >
            {/* Progress Bar */}
            <div className="relative h-1 mb-4 group/progress">
              {/* Buffered Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-white/30 rounded"
                style={{ width: `${buffered}%` }}
              />

              {/* Seek Slider */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Seek"
              />

              {/* Progress Track */}
              <div className="absolute top-0 left-0 h-full bg-white/50 rounded overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Progress Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                  onClick={handleTogglePlay}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>

                {/* Volume */}
                <div
                  className="relative flex items-center"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    onClick={handleToggleMute}
                    className="text-white hover:text-gray-200 transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    <VolumeIcon className="w-6 h-6" />
                  </button>

                  {/* Volume Slider */}
                  <div
                    className={`absolute left-8 flex items-center transition-all duration-200 ${showVolumeSlider
                        ? 'opacity-100 w-20'
                        : 'opacity-0 w-0 overflow-hidden'
                      }`}
                  >
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-white/30 rounded appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      aria-label="Volume"
                    />
                  </div>
                </div>

                {/* Time Display */}
                <div className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* Playback Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="text-white hover:text-gray-200 transition-colors flex items-center gap-1"
                    aria-label="Playback speed"
                  >
                    <SettingsIcon className="w-5 h-5" />
                    <span className="text-sm">{playbackRate}x</span>
                  </button>

                  {/* Speed Menu */}
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 rounded-lg py-2 min-w-[100px] shadow-lg">
                      {PLAYBACK_SPEEDS.map(speed => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`w-full px-4 py-1.5 text-left text-sm transition-colors ${playbackRate === speed
                              ? 'bg-white/20 text-white'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  onClick={handleToggleFullscreen}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <FullscreenExitIcon className="w-6 h-6" />
                  ) : (
                    <FullscreenIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Play Button Overlay (when paused) */}
        {!isPlaying && !isLoading && !hasError && controlsVisible && (
          <button
            onClick={handleTogglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            aria-label="Play"
          >
            <PlayIcon className="w-8 h-8 text-white ml-1" />
          </button>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
