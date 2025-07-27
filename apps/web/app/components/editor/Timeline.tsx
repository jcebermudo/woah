import { LayerContainer, Shape } from "@/types/canvasElements";
import { useStore, usePlaybackStore } from "@/app/zustland/store";
import { Pause, Play, Repeat2, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface TimelineProps {
  layers: LayerContainer[];
  selectedLayer: LayerContainer | null;
  layerDuration: number;
  selectedShape: Shape | null;
}

export default function Timeline({
  layers,
  selectedLayer,
  layerDuration,
  selectedShape,
}: TimelineProps) {
  const { mode, duration } = useStore();
  const {
    timelinePlayhead,
    isTimelinePlaying,
    timelineDuration,
    setTimelinePlayhead,
    setIsTimelinePlaying,
    setTimelineDuration,
  } = usePlaybackStore();
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.7);
  const [panOffset, setPanOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playStartTime, setPlayStartTime] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playStartTimeRef = useRef(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const selected = selectedShape || selectedLayer;

  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    setIsPlaying(true);
    setIsTimelinePlaying(true);
    const currentTime = getCurrentTime();

    // Store in ref instead of state
    playStartTimeRef.current = Date.now() - currentTime * 1000;

    playIntervalRef.current = setInterval(() => {
      // Use ref value (always current)
      const elapsed = (Date.now() - playStartTimeRef.current) / 1000;
      const totalDuration = layerDuration || 10;

      if (elapsed >= totalDuration) {
        pausePlayback();
        return;
      }

      const timelineWidth = getBaseTimelineWidth();
      const newPosition = (elapsed / totalDuration) * timelineWidth;
      setPlayheadPosition(newPosition);

      setTimelinePlayhead(elapsed);
    }, 16);
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    setIsTimelinePlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };

  const updatePlaybackOrigin = () => {
    // Removed the isPlaying condition - now always updates the origin
    const currentTime = getCurrentTime();
    playStartTimeRef.current = Date.now() - currentTime * 1000;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        togglePlay();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  // Zoom limits - adjust these values as needed
  const MIN_ZOOM = 0.5; // Minimum zoom out (shows more timeline)
  const MAX_ZOOM = 5; // Maximum zoom in (shows less timeline)

  if (mode === "design") {
    return null;
  }

  const getBaseTimelineWidth = () => {
    const totalDuration = layerDuration || 10;
    return Math.max(800, totalDuration * 80);
  };

  // Calculate the maximum allowed pan offset to keep 0s at the start
  const getMaxPanOffset = (currentZoom: number) => {
    if (!timelineRef.current) return 0;
    const timelineWidth =
      timelineRef.current.getBoundingClientRect().width || 800;

    // When zoomed out (zoom < 1), don't allow panning past 0
    if (currentZoom <= 1) {
      return 0;
    }

    // When zoomed in, allow panning but keep some content visible
    // This ensures 0s can always be reached by panning left
    return Math.max(0, timelineWidth * currentZoom - timelineWidth);
  };

  // Calculate minimum pan offset to prevent panning too far right
  const getMinPanOffset = (currentZoom: number) => {
    if (!timelineRef.current) return 0;

    // For zoom levels <= 1, prevent panning left (0s should stay at start)
    if (currentZoom <= 1) {
      return 0;
    }

    // For zoomed in levels, allow some negative panning but not too much
    // This prevents losing the timeline content entirely
    return -100; // Allow 100px of padding
  };

  // Handle zoom with Cmd/Ctrl + scroll - wrapped in useCallback to prevent stale closures
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();

        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        // Zoom factor
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

        setZoomLevel((currentZoom) => {
          const newZoomLevel = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, currentZoom * zoomFactor),
          );

          // Calculate new pan offset
          let newPanOffset;

          if (newZoomLevel <= 1) {
            // When zooming out to 1x or less, reset pan to 0 (0s at start)
            newPanOffset = 0;
          } else {
            // When zoomed in, calculate pan to keep zoom centered on mouse
            const zoomPoint = (mouseX + panOffset) / currentZoom;
            newPanOffset = zoomPoint * newZoomLevel - mouseX;

            // Apply pan limits
            const maxPan = getMaxPanOffset(newZoomLevel);
            const minPan = getMinPanOffset(newZoomLevel);
            newPanOffset = Math.max(minPan, Math.min(maxPan, newPanOffset));
          }

          setPanOffset(newPanOffset);
          return newZoomLevel;
        });
      }
    },
    [panOffset, getMaxPanOffset, getMinPanOffset],
  );

  // Add wheel event listener with proper dependencies
  useEffect(() => {
    const timeline = timelineContainerRef.current;
    if (timeline) {
      // Add event listener to the timeline element
      timeline.addEventListener("wheel", handleWheel, { passive: false });
      return () => timeline.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  // Handle panning with middle mouse button or shift+scroll (optional enhancement)
  const handlePan = (deltaX: number) => {
    if (zoomLevel <= 1) return; // No panning when not zoomed in

    const newPanOffset = panOffset + deltaX;
    const maxPan = getMaxPanOffset(zoomLevel);
    const minPan = getMinPanOffset(zoomLevel);

    setPanOffset(Math.max(minPan, Math.min(maxPan, newPanOffset)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTimelinePlaying) {
      pausePlayback();
    }
    setIsDragging(true);
    setIsScrubbing(true);
    e.preventDefault();
    e.stopPropagation();

    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - 20;

    // Convert screen position to timeline position considering zoom and pan
    const timelinePosition = (mouseX + panOffset) / zoomLevel;
    const maxPosition = getBaseTimelineWidth();

    setPlayheadPosition(Math.max(0, Math.min(timelinePosition, maxPosition)));

    // Critical idk or smthn
    const currentTime = getCurrentTime();
    setTimelinePlayhead(currentTime);

    // Update playback origin if currently playing
    updatePlaybackOrigin();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - 20;
    const timelinePosition = (mouseX + panOffset) / zoomLevel;
    const maxPosition = getBaseTimelineWidth();

    const newPosition = Math.max(0, Math.min(timelinePosition, maxPosition));
    setPlayheadPosition(newPosition);

    // Calculate current time directly
    const totalDuration = layerDuration || 10;
    const timelineWidth = getBaseTimelineWidth();
    const progress = newPosition / timelineWidth;
    const currentTime = Math.max(
      0,
      Math.min(progress * totalDuration, totalDuration),
    );

    setTimelinePlayhead(currentTime);
    updatePlaybackOrigin();
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsScrubbing(false);
  }, []);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - 20;

    // Convert screen position to timeline position considering zoom and pan
    const timelinePosition = (mouseX + panOffset) / zoomLevel;
    const maxPosition = getBaseTimelineWidth();

    setPlayheadPosition(Math.max(0, Math.min(timelinePosition, maxPosition)));

    // Critical idk or smthn
    const currentTime = getCurrentTime();
    setTimelinePlayhead(currentTime);

    // Update playback origin if currently playing
    updatePlaybackOrigin();
  };

  // Calculate current time based on playhead position
  const getCurrentTime = () => {
    if (!timelineRef.current) return 0;

    const totalDuration = layerDuration || 10;
    const timelineWidth = getBaseTimelineWidth();

    // The playheadPosition is already in timeline coordinate space
    // Just convert it directly to time based on the timeline width
    const progress = playheadPosition / timelineWidth;

    return Math.max(0, Math.min(progress * totalDuration, totalDuration));
  };

  // Format time for display in playhead
  const formatPlayheadTime = (timeInSeconds: number) => {
    const rounded = Math.round(timeInSeconds * 100) / 100; // Round to 2 decimal places
    const minutes = Math.floor(rounded / 60);
    const seconds = Math.floor(rounded % 60);
    const centiseconds = Math.floor((rounded % 1) * 100);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Generate time markers and subdivision dots
  const generateTimeMarkers = () => {
    if (!timelineRef.current) return { markers: [], dots: [] };

    const timelineWidth = getBaseTimelineWidth();
    const totalDuration = layerDuration || 10;
    const viewportWidth =
      timelineRef.current.getBoundingClientRect().width || 800;

    // Calculate the visible time range based on current zoom and pan
    const visibleStartTime = Math.max(
      0,
      (panOffset / (zoomLevel * timelineWidth)) * totalDuration,
    );
    const visibleEndTime = Math.min(
      totalDuration,
      ((panOffset + viewportWidth) / (zoomLevel * timelineWidth)) *
        totalDuration,
    );

    // Add some padding to render markers slightly outside viewport
    const paddingTime =
      ((viewportWidth * 0.1) / (zoomLevel * timelineWidth)) * totalDuration;
    const renderStartTime = Math.max(0, visibleStartTime - paddingTime);
    const renderEndTime = Math.min(totalDuration, visibleEndTime + paddingTime);

    // Main second markers
    let interval = 1;
    const markers = [];

    // Calculate which markers to render based on visible time range
    const startMarker = Math.floor(renderStartTime / interval);
    const endMarker = Math.ceil(renderEndTime / interval);

    for (let i = startMarker; i <= endMarker; i++) {
      const time = i * interval;
      if (time >= 0 && time <= totalDuration) {
        // Apply zoom and pan transformation
        const basePosition = (time / totalDuration) * timelineWidth;
        const position = basePosition * zoomLevel - panOffset + 11.5;

        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        let timeLabel;

        if (interval < 1) {
          timeLabel = `${time.toFixed(1)}s`;
        } else {
          timeLabel =
            minutes > 0
              ? `${minutes}:${seconds.toString().padStart(2, "0")}`
              : `${seconds}s`;
        }

        markers.push({
          position,
          time,
          label: timeLabel,
        });
      }
    }

    // Generate subdivision dots (4 dots between each second)
    const dots = [];
    if (zoomLevel > 0.7) {
      for (
        let i = Math.floor(renderStartTime);
        i <= Math.ceil(renderEndTime);
        i++
      ) {
        for (let j = 1; j <= 4; j++) {
          const time = i + j * 0.2;
          if (
            time >= renderStartTime &&
            time <= renderEndTime &&
            time < totalDuration &&
            time >= 0
          ) {
            const basePosition = (time / totalDuration) * timelineWidth;
            const position = basePosition * zoomLevel - panOffset + 20;
            dots.push({ position, time });
          }
        }
      }
    }

    return {
      markers,
      dots,
      lastMarkerPosition:
        markers.length > 0 ? Math.max(...markers.map((m) => m.position)) : 0,
    };
  };

  const {
    markers: timeMarkers,
    dots: subdivisionDots,
    lastMarkerPosition,
  } = generateTimeMarkers();

  // Calculate playhead screen position with zoom and pan
  const getPlayheadScreenPosition = () => {
    if (!timelineRef.current) return 0;
    return playheadPosition * zoomLevel - panOffset + 20;
  };

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  // Get animation tracks for the selected shape
  const getAnimationTracks = () => {
    if (!selectedShape?.animations) return [];
    return selectedShape.animations.filter((animation) => animation.enabled);
  };

  const animationTracks = getAnimationTracks();
  const TRACK_HEIGHT = 250; // Height of each animation track
  const TRACK_HEADER_WIDTH = 250; // Width of the track name section

  // Calculate timeline height based on number of tracks
  const getTimelineHeight = () => {
    const baseHeight = 50; // Header height
    const tracksHeight = Math.max(animationTracks.length, 1) * TRACK_HEIGHT;
    return baseHeight + tracksHeight;
  };

  if (!selected) {
    return (
      <div className="h-screen w-full">
        <h2 className="text-white">select something pls</h2>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <div className="w-full h-[50px] bg-[#232323] border-b border-[#474747] flex flex-row justify-center items-center">
        <div className="flex flex-row gap-[10px]">
          <button onClick={togglePlay}>
            {isTimelinePlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white" />
            )}
          </button>
          <button>
            <Repeat2 className="w-4 h-4 text-white" />
          </button>
          {/* Zoom indicator */}
          <div className="ml-4 text-xs text-gray-400">
            {Math.round(zoomLevel * 100)}%
          </div>
          {/* Pan indicator (for debugging) */}
          {panOffset !== 0 && (
            <div className="ml-2 text-xs text-blue-400">
              Pan: {Math.round(panOffset)}px
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-row h-[520px] w-full overflow-x-auto">
        {/* Track Headers - Left Sidebar */}
        <div className="bg-[#232323] border-r border-[#474747] h-full min-w-[250px] z-[50]">
          {/* Timeline header */}
          <div className="bg-[#232323] h-[50px] border-b border-[#474747] w-full flex flex-row items-center justify-center">
            <span className="text-gray-400 text-sm">Animations</span>
          </div>

          {/* Animation tracks headers */}
          {animationTracks.length > 0 ? (
            <div className="overflow-y-auto">
              {animationTracks.map((animation, index) => (
                <div
                  key={animation.id}
                  className="h-[40px] border-b border-[#474747] flex items-center px-4 bg-[#232323] hover:bg-[#2a2a2a]"
                >
                  <div className="flex items-center gap-2 w-full">
                    <button className="text-gray-400 hover:text-white">
                      <Eye className="w-3 h-3" />
                    </button>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {animation.type.charAt(0).toUpperCase() +
                          animation.type.slice(1)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {animation.duration}s{animation.repeat === -1 && " ∞"}
                      </div>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        animation.enabled ? "bg-green-400" : "bg-gray-600"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[40px] text-gray-400 text-sm">
              No animations
            </div>
          )}
        </div>

        {/* Timeline Area */}
        <div
          ref={timelineContainerRef}
          className="bg-[#232323] overflow-x-auto overflow-y-hidden w-full"
          style={{ height: `${getTimelineHeight()}px` }}
        >
          {/* Timeline header with time markers */}
          <div className="h-[50px] border-b border-[#474747]">
            <div
              ref={timelineRef}
              className="flex flex-row h-[50px] ml-[20px] relative cursor-pointer"
              style={{
                width: `${Math.max(800, (lastMarkerPosition || 0) + 100)}px`,
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Subdivision dots */}
              {zoomLevel > 0.7 &&
                subdivisionDots.map((dot, index) => (
                  <div
                    key={`dot-${dot.time}-${index}`}
                    className="absolute top-[28px]"
                    style={{ left: `${dot.position}px` }}
                  >
                    <div className="w-[3px] h-[3px] bg-[#474747] rounded-full" />
                  </div>
                ))}

              {/* Time markers */}
              {timeMarkers.map((marker, index) => (
                <div
                  key={`marker-${marker.time}-${index}`}
                  className="absolute top-[10px] w-[20px] flex flex-col items-center"
                  style={{ left: `${marker.position}px` }}
                >
                  <div className="text-[14px] text-gray-400 mb-1 select-none whitespace-nowrap">
                    {marker.label}
                  </div>
                  <div className="bg-[#474747] w-[1px] h-[15px]" />
                </div>
              ))}

              {/* Playhead */}
              <div
                onMouseDown={handleMouseDown}
                className="text-white text-[14px] bg-[#29A9FF] w-[45px] h-[25px] cursor-grab active:cursor-grabbing flex items-center justify-center rounded-md absolute top-[10px] z-40"
                style={{ left: `${getPlayheadScreenPosition() - 22}px` }}
              >
                {formatPlayheadTime(getCurrentTime())}
              </div>
              <div
                className="top-[10px] z-20 cursor-grab absolute active:cursor-grabbing"
                style={{ left: `${getPlayheadScreenPosition()}px` }}
                onMouseDown={handleMouseDown}
              >
                <div
                  className="w-[1px] bg-[#29A9FF] z-10"
                  style={{ height: `${getTimelineHeight()}px` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Animation Track Bars */}
          {animationTracks.length > 0 && (
            <div className="relative">
              {animationTracks.map((animation, index) => {
                const timelineWidth = getBaseTimelineWidth();
                const totalDuration = layerDuration || 10;

                // Calculate animation bar position and width
                const animationStartPosition = 0; // Animations start at 0s
                const animationWidth =
                  (animation.duration / totalDuration) * timelineWidth;
                const screenStartPosition =
                  animationStartPosition * zoomLevel - panOffset;
                const screenWidth = animationWidth * zoomLevel;

                // Animation type colors
                const getAnimationColor = (type: string) => {
                  switch (type) {
                    case "spin":
                      return "#FF6B6B";
                    case "pulse":
                      return "#4ECDC4";
                    case "bounce":
                      return "#45B7D1";
                    case "fade":
                      return "#96CEB4";
                    case "shake":
                      return "#FFEAA7";
                    default:
                      return "#DDA0DD";
                  }
                };

                return (
                  <div
                    key={animation.id}
                    className="absolute"
                    style={{ height: `${TRACK_HEIGHT}px` }}
                  >
                    {/* Track background */}
                    <div className="absolute inset-0 border-b border-[#474747] bg-[#232323] hover:bg-[#2a2a2a]" />

                    {/* Animation bar */}
                    {screenWidth > 0 && (
                      <div
                        className="absolute ml-[10px] h-[36px] rounded-md flex items-center px-2 border border-opacity-50"
                        style={{
                          left: `${screenStartPosition + 30}px`,
                          width: `${Math.max(10, screenWidth)}px`,
                          backgroundColor: getAnimationColor(animation.type),
                          borderColor: getAnimationColor(animation.type),
                          opacity: animation.enabled ? 0.8 : 0.4,
                        }}
                      >
                        <div className="text-white text-xs font-medium truncate">
                          {animation.type}
                          {animation.repeat === -1 && " ∞"}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state when no animations */}
          {animationTracks.length === 0 && (
            <div className="flex items-center justify-center h-[40px] text-gray-400 text-sm">
              Add animations to see tracks
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
