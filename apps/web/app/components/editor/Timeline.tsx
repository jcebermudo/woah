import { useStore } from "@/app/zustland/store";
import { Play, Repeat2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

export default function Timeline() {
  const { mode, duration } = useStore();
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Zoom limits - adjust these values as needed
  const MIN_ZOOM = 1; // Minimum zoom out (shows more timeline)
  const MAX_ZOOM = 5; // Maximum zoom in (shows less timeline)

  if (mode === "design") {
    return null;
  }

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
            Math.min(MAX_ZOOM, currentZoom * zoomFactor)
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
    [panOffset, getMaxPanOffset, getMinPanOffset]
  );

  // Add wheel event listener with proper dependencies
  useEffect(() => {
    const timeline = timelineRef.current;
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
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      // Convert screen position to timeline position considering zoom and pan
      const timelinePosition = (mouseX + panOffset) / zoomLevel;
      const maxPosition = rect.width;

      setPlayheadPosition(Math.max(0, Math.min(timelinePosition, maxPosition)));
    },
    [isDragging, panOffset, zoomLevel]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Convert screen position to timeline position considering zoom and pan
    const timelinePosition = (mouseX + panOffset) / zoomLevel;
    const maxPosition = rect.width;

    setPlayheadPosition(Math.max(0, Math.min(timelinePosition, maxPosition)));
  };

  // Calculate current time based on playhead position
  const getCurrentTime = () => {
    if (!timelineRef.current) return 0;

    const totalDuration = duration || 10;
    const timelineWidth =
      timelineRef.current.getBoundingClientRect().width || 800;

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

    const timelineWidth =
      timelineRef.current.getBoundingClientRect().width || 800;
    const totalDuration = duration || 10;

    // Main second markers
    let interval = 1;
    const markers = [];
    const markerCount = Math.floor(totalDuration / interval);

    for (let i = 0; i <= markerCount; i++) {
      const time = i * interval;
      // Apply zoom and pan transformation
      const basePosition = (time / totalDuration) * timelineWidth;
      const position = basePosition * zoomLevel - panOffset;

      // Only render markers that are visible
      if (position >= -50 && position <= timelineWidth + 50) {
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
    for (let i = 0; i < totalDuration; i++) {
      for (let j = 1; j <= 4; j++) {
        const time = i + j * 0.2; // 0.2 second intervals (5 subdivisions per second)
        const basePosition = (time / totalDuration) * timelineWidth;
        const position = basePosition * zoomLevel - panOffset;

        // Only render dots that are visible and within duration
        if (
          position >= -50 &&
          position <= timelineWidth + 50 &&
          time < totalDuration
        ) {
          dots.push({
            position,
            time,
          });
        }
      }
    }

    return { markers, dots };
  };

  const { markers: timeMarkers, dots: subdivisionDots } = generateTimeMarkers();

  // Calculate playhead screen position with zoom and pan
  const getPlayheadScreenPosition = () => {
    if (!timelineRef.current) return 0;
    return playheadPosition * zoomLevel - panOffset;
  };

  return (
    <div className="h-screen w-full">
      <div className="flex flex-row h-full w-full">
        <div className="bg-[#232323] border-r border-[#474747] h-full min-w-[320px] z-[50]">
          <div className="bg-[#232323] h-[50px] border-b border-[#474747] w-full flex flex-row items-center justify-center">
            <div className="flex flex-row gap-[10px]">
              <button>
                <Play className="w-4 h-4 text-white fill-white" />
              </button>
              <button>
                <Repeat2 className="w-4 h-4 text-white" />
              </button>
            </div>
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
        <div className="bg-[#232323] w-full">
          <div className="w-full h-[50px] border-b border-[#474747]">
            <div
              ref={timelineRef}
              className="flex flex-row w-full h-[50px] ml-[35px] relative cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* Subdivision dots */}
              {subdivisionDots.map((dot, index) => (
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
                  className="absolute top-[10px] flex flex-col items-center"
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
                className="h-[30px] w-[70px] bg-red-500 rounded-md absolute top-[10px] z-20 cursor-grab active:cursor-grabbing flex items-center justify-center"
                style={{ left: `${getPlayheadScreenPosition() - 29}px` }}
                onMouseDown={handleMouseDown}
              >
                <div className="text-white text-xs font-medium select-none z-30">
                  {formatPlayheadTime(getCurrentTime())}
                </div>
                <div className="w-[2px] h-screen bg-red-500 absolute left-[50%] top-0 z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
