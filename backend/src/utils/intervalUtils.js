/**
 * Merges overlapping or adjacent intervals.
 * Assumes intervals are { start: number, end: number }.
 * @param {Array<{start: number, end: number}>} intervals - Array of intervals (doesn't need to be pre-sorted).
 * @returns {Array<{start: number, end: number}>} - Array of merged, sorted intervals.
 */
export const mergeIntervals = (intervals) => {
  // Ensure 'export' keyword is present
  if (!intervals || intervals.length === 0) {
    return [];
  }

  // Create a copy to avoid modifying the original array if passed by reference elsewhere
  const intervalsCopy = [...intervals];

  // Sort intervals by start time
  intervalsCopy.sort((a, b) => a.start - b.start);

  // Initialize merged array with the first interval
  const merged = [intervalsCopy[0]];

  for (let i = 1; i < intervalsCopy.length; i++) {
    const current = intervalsCopy[i];
    const lastMerged = merged[merged.length - 1];

    // Check for valid interval structure defensively
    if (
      typeof current.start !== "number" ||
      typeof current.end !== "number" ||
      typeof lastMerged.end !== "number"
    ) {
      console.warn(
        "Skipping invalid interval structure during merge:",
        current
      );
      continue; // Skip potentially malformed intervals
    }

    // If current interval overlaps or touches the last merged one
    if (current.start <= lastMerged.end) {
      // Merge by extending the end of the last merged interval if necessary
      lastMerged.end = Math.max(lastMerged.end, current.end);
    } else {
      // No overlap, add the current interval as a new one
      merged.push(current);
    }
  }

  return merged;
};

/**
 * Calculates the total duration of unique intervals.
 * @param {Array<{start: number, end: number}>} intervals - Array of non-overlapping intervals.
 * @returns {number} - Total unique seconds watched.
 */
export const calculateTotalSeconds = (intervals) => {
  // Ensure 'export' keyword is present
  if (!intervals) return 0; // Handle null or undefined input

  return intervals.reduce((total, interval) => {
    // Add safety check for valid intervals before calculation
    if (
      interval &&
      typeof interval.start === "number" &&
      typeof interval.end === "number" &&
      interval.end >= interval.start
    ) {
      return total + (interval.end - interval.start);
    }
    // Log or handle invalid interval structures if necessary
    // console.warn("Invalid interval structure encountered during sum:", interval);
    return total; // Ignore invalid intervals in sum
  }, 0);
};
