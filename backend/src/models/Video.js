import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a video title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Custom identifier (e.g., URL slug) used in routes
    videoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cloudinaryUrl: {
      // URL to access the video on Cloudinary
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      // ID used to manage the asset in Cloudinary (e.g., for deletion)
      type: String,
      required: true,
    },
    duration: {
      // Duration in seconds (Cloudinary might provide this)
      type: Number,
      default: 0,
    },
    uploader: {
      // Reference to the User who uploaded the video
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Optional: Pre-save hook to generate videoId from title (slugify)
// You'd need a slugify library like 'slugify'
// videoSchema.pre('validate', function(next) {
//   if (this.title && this.isNew) {
//     // Example: this.videoId = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
//   }
//   next();
// });

const Video = mongoose.model("Video", videoSchema);
export default Video;
