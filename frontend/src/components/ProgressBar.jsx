import React from "react";

/**
 * A progress bar component that visually represents watched video segments.
 * @param {object} props - Component props.
 * @param {Array<{start: number, end: number}>} props.intervals - Array of watched intervals.
 * @param {number} props.duration - Total duration of the video in seconds.
 */
const ProgressBar = ({ intervals = [], duration = 0 }) => {
  // Calculate the overall percentage for the text label
  const totalWatched = intervals.reduce((sum, interval) => {
    // Basic validation within reduce
    if (
      interval &&
      typeof interval.start === "number" &&
      typeof interval.end === "number" &&
      interval.end > interval.start
    ) {
      return sum + (interval.end - interval.start);
    }
    return sum;
  }, 0);

  const overallPercentage = duration > 0 ? (totalWatched / duration) * 100 : 0;
  // Ensure percentage is valid for display
  const displayPercentage = Math.max(
    0,
    Math.min(100, Number(overallPercentage) || 0)
  );

  return (
    <div className="w-full my-2">
      {/* Container for the bar - acts as the background/unwatched track */}
      {/* Added relative positioning and overflow hidden */}
      <div className="bg-gray-300 dark:bg-gray-700 rounded-full h-2.5 w-full relative overflow-hidden">
        {/* Map over the watched intervals to render segments */}
        {duration > 0 &&
          intervals.map((interval, index) => {
            // Validate interval structure again just in case
            if (
              !(
                interval &&
                typeof interval.start === "number" &&
                typeof interval.end === "number" &&
                interval.end > interval.start &&
                interval.start >= 0
              )
            ) {
              return null; // Skip rendering invalid intervals
            }

            // Calculate position and width as percentages
            const leftPercent = (interval.start / duration) * 100;
            const widthPercent =
              ((interval.end - interval.start) / duration) * 100;

            // Clamp values to prevent visual glitches (0% to 100%)
            const clampedLeft = Math.max(0, leftPercent);
            const clampedWidth = Math.max(
              0,
              Math.min(widthPercent, 100 - clampedLeft)
            ); // Ensure width doesn't exceed bounds

            // Skip rendering if width is effectively zero after clamping
            if (clampedWidth <= 0.01) return null;

            return (
              <div
                key={`interval-${index}-${interval.start}`} // More unique key
                className="absolute top-0 h-full bg-blue-600" // Watched segment color
                // Apply calculated styles for positioning and width
                // Added rounding *within* the segment for better look with overflow hidden
                style={{
                  left: `${clampedLeft}%`,
                  width: `${clampedWidth}%`,
                  borderRadius: "9999px", // Apply rounding to segments too
                }}
                // Add title attribute for tooltip on hover (optional)
                title={`Watched: ${interval.start.toFixed(
                  1
                )}s - ${interval.end.toFixed(1)}s`}
              ></div>
            );
          })}
      </div>

      {/* Text label showing the overall unique percentage */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 inline-block">
        {displayPercentage.toFixed(1)}% Watched (Unique)
      </span>
    </div>
  );
};

export default ProgressBar;
