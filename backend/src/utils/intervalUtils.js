/**
 * Merges overlapping or adjacent intervals.
 * Assumes intervals are { start: number, end: number }.
 */
export const mergeIntervals = (intervals) => {
  if (!intervals || intervals.length === 0) {
    return [];
  }

  const intervalsCopy = [...intervals];

  intervalsCopy.sort((a, b) => a.start - b.start);

  const merged = [intervalsCopy[0]];

  for (let i = 1; i < intervalsCopy.length; i++) {
    const current = intervalsCopy[i];
    const lastMerged = merged[merged.length - 1];

    if (
      typeof current.start !== "number" ||
      typeof current.end !== "number" ||
      typeof lastMerged.end !== "number"
    ) {
      console.warn(
        "Skipping invalid interval structure during merge:",
        current
      );
      continue;
    }

    // If current interval overlaps or touches the last merged one
    if (current.start <= lastMerged.end) {
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
 */
export const calculateTotalSeconds = (intervals) => {
  if (!intervals) return 0;

  return intervals.reduce((total, interval) => {
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
