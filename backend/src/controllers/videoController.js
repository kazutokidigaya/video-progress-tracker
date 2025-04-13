import Video from "../models/Video.js";
import cloudinary from "../config/cloudinary.js";

export const uploadVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video file uploaded" });
  }

  const { title, description } = req.body;
  const videoId =
    req.body.videoId ||
    title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

  if (!title) {
    await cloudinary.uploader.destroy(req.file.filename, {
      resource_type: "video",
    });
    return res.status(400).json({ message: "Video title is required" });
  }

  try {
    // Check if videoId already exists
    const existingVideo = await Video.findOne({ videoId });
    if (existingVideo) {
      await cloudinary.uploader.destroy(req.file.filename, {
        resource_type: "video",
      }); // Cleanup
      return res
        .status(400)
        .json({ message: `Video with ID '${videoId}' already exists.` });
    }

    const newVideo = new Video({
      title,
      description,
      videoId: videoId,
      cloudinaryUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      duration: req.file.duration || 0,
      uploader: req.user.id,
    });

    const savedVideo = await newVideo.save();

    res.status(201).json({
      _id: savedVideo._id,
      title: savedVideo.title,
      description: savedVideo.description,
      videoId: savedVideo.videoId,
      cloudinaryUrl: savedVideo.cloudinaryUrl,
      duration: savedVideo.duration,
      createdAt: savedVideo.createdAt,
    });
  } catch (error) {
    console.error("Video Save Error:", error);

    try {
      await cloudinary.uploader.destroy(req.file.filename, {
        resource_type: "video",
      });
    } catch (cleanupError) {
      console.error("Cloudinary cleanup failed after DB error:", cleanupError);
    }
    res.status(500).json({
      message: "Server error saving video metadata",
      error: error.message,
    });
  }
};

export const listVideos = async (req, res) => {
  try {
    const videos = await Video.find({})
      .select("title description videoId duration createdAt")
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(videos);
  } catch (error) {
    console.error("List Videos Error:", error);
    res
      .status(500)
      .json({ message: "Server error listing videos", error: error.message });
  }
};

export const getVideoDetails = async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId }).select(
      "-cloudinaryPublicId -uploader -updatedAt"
    );

    if (video) {
      res.json(video);
    } else {
      res.status(404).json({ message: "Video not found" });
    }
  } catch (error) {
    console.error("Get Video Details Error:", error);
    res.status(500).json({
      message: "Server error fetching video details",
      error: error.message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res
        .status(404)
        .json({ message: "Video metadata not found in database" });
    }

    try {
      const result = await cloudinary.uploader.destroy(
        video.cloudinaryPublicId,
        {
          resource_type: "video",
        }
      );

      if (result.result !== "ok" && result.result !== "not found") {
        console.warn(
          `Cloudinary deletion might have failed for public_id: ${video.cloudinaryPublicId}`,
          result
        );
      }
    } catch (cloudinaryError) {
      console.error(
        `Cloudinary Deletion Error for ${video.cloudinaryPublicId}:`,
        cloudinaryError
      );

      return res.status(500).json({
        message:
          "Error deleting video from Cloudinary. Database record not deleted.",
        error: cloudinaryError.message,
      });
    }

    await Video.deleteOne({ _id: req.params.id });

    res.json({
      message: "Video deleted successfully from Cloudinary and database",
    });
  } catch (error) {
    console.error("Delete Video Error:", error);
    res
      .status(500)
      .json({ message: "Server error deleting video", error: error.message });
  }
};
