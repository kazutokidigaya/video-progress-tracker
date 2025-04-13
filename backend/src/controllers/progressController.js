import VideoProgress from "../models/VideoProgress.js"; // Ensure .js extension

// Get progress (remains the same)
export const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;
    if (!videoId)
      return res.status(400).json({ message: "Video ID is required" });

    const progress = await VideoProgress.findOne({ userId, videoId });
    if (!progress) {
      return res.status(200).json({
        userId,
        videoId,
        watchedIntervals: [],
        totalUniqueWatchedSeconds: 0,
        progressPercentage: 0,
        lastWatchedPosition: 0,
        videoDuration: 0,
        message: "No progress found for this user/video.",
      });
    }
    res.status(200).json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res
      .status(500)
      .json({
        message: "Server error while fetching progress",
        error: error.message,
      });
  }
};

// Update or create progress for a specific video for the LOGGED-IN user
export const updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;
    // Expect 'intervals' array and 'lastWatchedPosition' number
    const { intervals, lastWatchedPosition, videoDuration } = req.body;

    if (!videoId) {
      return res.status(400).json({ message: "Video ID is required" });
    }
    // Check if at least intervals or position is provided
    if (!Array.isArray(intervals) && typeof lastWatchedPosition !== "number") {
      return res
        .status(400)
        .json({
          message:
            "Request must include intervals array or lastWatchedPosition number",
        });
    }

    // Find existing progress or prepare to create a new one
    let progress = await VideoProgress.findOne({ userId, videoId });

    // If no progress exists, create it
    if (!progress) {
      let durationToUse = videoDuration;
      // If duration wasn't provided in this request, try to find it from general video info
      if (typeof durationToUse !== "number" || durationToUse <= 0) {
        const Video = mongoose.model("Video"); // Get Video model - ensure it's registered
        const videoInfo = await Video.findOne({ videoId }).select("duration");
        durationToUse = videoInfo?.duration || 0;
      }
      // If still no valid duration, we cannot create progress accurately
      if (durationToUse <= 0) {
        console.error(
          `Cannot create progress for ${userId}/${videoId} without a valid videoDuration.`
        );
        return res
          .status(400)
          .json({
            message:
              "Valid videoDuration is required to create/update progress.",
          });
      }

      progress = new VideoProgress({
        userId,
        videoId,
        videoDuration: durationToUse,
        lastWatchedPosition:
          typeof lastWatchedPosition === "number" ? lastWatchedPosition : 0,
        watchedIntervals: [], // Initialize intervals
      });
    }

    // Update video duration if provided and different (and valid)
    if (
      typeof videoDuration === "number" &&
      videoDuration > 0 &&
      progress.videoDuration !== videoDuration
    ) {
      progress.videoDuration = videoDuration;
    }

    // Update last watched position if provided
    if (typeof lastWatchedPosition === "number") {
      // Basic validation: position should not be negative or exceed known duration
      progress.lastWatchedPosition = Math.max(
        0,
        Math.min(lastWatchedPosition, progress.videoDuration || Infinity)
      );
    }

    // Set/Update watched intervals using the new method if intervals array is provided
    if (Array.isArray(intervals)) {
      // The model method now handles validation and merging
      progress.setWatchedIntervals(intervals);
    } else {
      // If only position was updated, we still need to ensure progress % is calculated if duration changed
      if (progress.isModified("videoDuration")) {
        progress.calculateProgress();
      }
    }

    // Save the document (Mongoose handles pre-save hook for calculations)
    const updatedProgress = await progress.save();

    // Return relevant fields (same as before)
    res.status(200).json({
      watchedIntervals: updatedProgress.watchedIntervals,
      progressPercentage: updatedProgress.progressPercentage,
      totalUniqueWatchedSeconds: updatedProgress.totalUniqueWatchedSeconds,
      lastWatchedPosition: updatedProgress.lastWatchedPosition,
    });
  } catch (error) {
    // Handle potential VersionError specifically if needed, though debouncing should help
    if (error.name === "VersionError") {
      console.warn(
        `VersionError encountered for video ${req.params.videoId}, user ${req.user.id}. Might indicate rapid updates.`,
        error.message
      );
      // Optionally, fetch the latest progress again and return it? Or just let client retry?
      // For now, return a specific error status.
      return res.status(409).json({
        // 409 Conflict
        message:
          "Conflict saving progress due to concurrent updates. Please try again.",
        error: error.message,
      });
    }
    console.error("Error updating progress:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({
        message: "Server error while updating progress",
        error: error.message,
      });
  }
};
