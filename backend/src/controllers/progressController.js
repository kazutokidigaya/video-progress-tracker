import VideoProgress from "../models/VideoProgress.js";

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
    res.status(500).json({
      message: "Server error while fetching progress",
      error: error.message,
    });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;

    const { intervals, lastWatchedPosition, videoDuration } = req.body;

    if (!videoId) {
      return res.status(400).json({ message: "Video ID is required" });
    }

    if (!Array.isArray(intervals) && typeof lastWatchedPosition !== "number") {
      return res.status(400).json({
        message:
          "Request must include intervals array or lastWatchedPosition number",
      });
    }

    let progress = await VideoProgress.findOne({ userId, videoId });

    if (!progress) {
      let durationToUse = videoDuration;

      if (typeof durationToUse !== "number" || durationToUse <= 0) {
        const Video = mongoose.model("Video"); // Get Video model - ensure it's registered
        const videoInfo = await Video.findOne({ videoId }).select("duration");
        durationToUse = videoInfo?.duration || 0;
      }

      if (durationToUse <= 0) {
        console.error(
          `Cannot create progress for ${userId}/${videoId} without a valid videoDuration.`
        );
        return res.status(400).json({
          message: "Valid videoDuration is required to create/update progress.",
        });
      }

      progress = new VideoProgress({
        userId,
        videoId,
        videoDuration: durationToUse,
        lastWatchedPosition:
          typeof lastWatchedPosition === "number" ? lastWatchedPosition : 0,
        watchedIntervals: [],
      });
    }

    if (
      typeof videoDuration === "number" &&
      videoDuration > 0 &&
      progress.videoDuration !== videoDuration
    ) {
      progress.videoDuration = videoDuration;
    }

    if (typeof lastWatchedPosition === "number") {
      progress.lastWatchedPosition = Math.max(
        0,
        Math.min(lastWatchedPosition, progress.videoDuration || Infinity)
      );
    }

    if (Array.isArray(intervals)) {
      progress.setWatchedIntervals(intervals);
    } else {
      if (progress.isModified("videoDuration")) {
        progress.calculateProgress();
      }
    }

    const updatedProgress = await progress.save();

    res.status(200).json({
      watchedIntervals: updatedProgress.watchedIntervals,
      progressPercentage: updatedProgress.progressPercentage,
      totalUniqueWatchedSeconds: updatedProgress.totalUniqueWatchedSeconds,
      lastWatchedPosition: updatedProgress.lastWatchedPosition,
    });
  } catch (error) {
    if (error.name === "VersionError") {
      console.warn(
        `VersionError encountered for video ${req.params.videoId}, user ${req.user.id}. Might indicate rapid updates.`,
        error.message
      );

      return res.status(409).json({
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
    res.status(500).json({
      message: "Server error while updating progress",
      error: error.message,
    });
  }
};
