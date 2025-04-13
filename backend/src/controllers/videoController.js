import Video from "../models/Video.js";
import cloudinary from "../config/cloudinary.js"; // Import configured Cloudinary instance

// @desc    Upload a new video (Admin only)
// @route   POST /api/videos/upload
// @access  Private/Admin
export const uploadVideo = async (req, res) => {
  // File upload is handled by multer middleware configured in the route
  // req.file should contain Cloudinary upload result
  if (!req.file) {
    return res.status(400).json({ message: "No video file uploaded" });
  }
  // console.log('Cloudinary Upload Result:', req.file); // Debugging

  const { title, description } = req.body;
  const videoId =
    req.body.videoId ||
    title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(); // Simple slug generation

  if (!title) {
    // If upload succeeded but metadata missing, attempt cleanup on Cloudinary
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
      videoId: videoId, // Use generated or provided videoId
      cloudinaryUrl: req.file.path, // URL from Cloudinary (path property from multer-storage-cloudinary)
      cloudinaryPublicId: req.file.filename, // Public ID from Cloudinary (filename property)
      duration: req.file.duration || 0, // Duration from Cloudinary if available
      uploader: req.user.id, // ID of the logged-in admin user
    });

    const savedVideo = await newVideo.save();

    // Send back metadata of the saved video
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
    // Attempt to delete the orphaned Cloudinary upload if DB save fails
    try {
      await cloudinary.uploader.destroy(req.file.filename, {
        resource_type: "video",
      });
    } catch (cleanupError) {
      console.error("Cloudinary cleanup failed after DB error:", cleanupError);
    }
    res
      .status(500)
      .json({
        message: "Server error saving video metadata",
        error: error.message,
      });
  }
};

// @desc    Get list of all video metadata
// @route   GET /api/videos
// @access  Public (or Private if only logged-in users can see list)
export const listVideos = async (req, res) => {
  try {
    // Fetch only relevant fields for listing
    const videos = await Video.find({})
      .select("title description videoId duration createdAt") // Select fields
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(videos);
  } catch (error) {
    console.error("List Videos Error:", error);
    res
      .status(500)
      .json({ message: "Server error listing videos", error: error.message });
  }
};

// @desc    Get details for a single video by videoId
// @route   GET /api/videos/:videoId
// @access  Public (or Private)
export const getVideoDetails = async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId }).select(
      "-cloudinaryPublicId -uploader -updatedAt"
    ); // Exclude sensitive/internal fields

    if (video) {
      res.json(video);
    } else {
      res.status(404).json({ message: "Video not found" });
    }
  } catch (error) {
    console.error("Get Video Details Error:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching video details",
        error: error.message,
      });
  }
};

// @desc    Delete a video (Admin only)
// @route   DELETE /api/videos/:id (Using MongoDB _id for deletion)
// @access  Private/Admin
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res
        .status(404)
        .json({ message: "Video metadata not found in database" });
    }

    // 1. Delete from Cloudinary
    try {
      const result = await cloudinary.uploader.destroy(
        video.cloudinaryPublicId,
        {
          resource_type: "video", // Important: specify resource type
        }
      );
      // console.log("Cloudinary Delete Result:", result); // Debug log
      // Cloudinary destroy returns { result: 'ok' } on success or { result: 'not found' }
      if (result.result !== "ok" && result.result !== "not found") {
        console.warn(
          `Cloudinary deletion might have failed for public_id: ${video.cloudinaryPublicId}`,
          result
        );
        // Decide if you want to stop or continue with DB deletion
      }
    } catch (cloudinaryError) {
      console.error(
        `Cloudinary Deletion Error for ${video.cloudinaryPublicId}:`,
        cloudinaryError
      );
      // Decide if you want to stop or proceed with DB deletion anyway
      // Maybe return a partial success message?
      return res
        .status(500)
        .json({
          message:
            "Error deleting video from Cloudinary. Database record not deleted.",
          error: cloudinaryError.message,
        });
    }

    // 2. Delete from Database
    await Video.deleteOne({ _id: req.params.id }); // Use deleteOne or findByIdAndDelete

    // TODO: Optional - Delete associated progress records? Decide based on requirements.
    // await VideoProgress.deleteMany({ videoId: video.videoId });

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
