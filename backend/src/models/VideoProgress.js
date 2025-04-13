import mongoose from "mongoose";
import {
  mergeIntervals,
  calculateTotalSeconds,
} from "../utils/intervalUtils.js";

const Schema = mongoose.Schema;

const intervalSchemaDefinition = {
  start: { type: Number, required: true },
  end: { type: Number, required: true },
};

const videoProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    videoId: { type: String, required: true, index: true },
    watchedIntervals: { type: [intervalSchemaDefinition], default: [] },
    totalUniqueWatchedSeconds: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
    lastWatchedPosition: { type: Number, default: 0 },
    videoDuration: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

videoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

//Corrected:** Merges the newly provided intervals.

videoProgressSchema.methods.setWatchedIntervals = function (newIntervalsArray) {
  // 1. Get previously stored intervals (ensure it's an array)
  const existingIntervals = this.watchedIntervals || [];

  // 2. Validate the incoming new intervals array
  if (!Array.isArray(newIntervalsArray)) {
    console.warn(
      `Invalid new intervals array received for video ${this.videoId}, user ${this.userId}:`,
      newIntervalsArray
    );
    this.calculateProgress();
    return;
  }

  // 3. Filter and validate intervals from the new array
  const validNewIntervals = newIntervalsArray.filter(
    (interval) =>
      interval &&
      typeof interval.start === "number" &&
      typeof interval.end === "number" &&
      interval.start < interval.end && // Ensure start is strictly less than end
      interval.start >= 0 // Ensure start is not negative
  );

  // 4. Combine existing intervals with the *valid* new intervals
  const combinedIntervals = [...existingIntervals, ...validNewIntervals];

  // 5. Merge the combined set and update the document's watchedIntervals
  this.watchedIntervals = mergeIntervals(combinedIntervals);

  // 6. Recalculate progress based on the final merged intervals
  this.calculateProgress();
};

/**
 * Recalculates totalUniqueWatchedSeconds and progressPercentage.
 */
videoProgressSchema.methods.calculateProgress = function () {
  this.totalUniqueWatchedSeconds = calculateTotalSeconds(this.watchedIntervals);
  if (this.videoDuration > 0) {
    const percentage =
      (this.totalUniqueWatchedSeconds / this.videoDuration) * 100;
    this.progressPercentage = Math.max(
      0,
      Math.min(100, Math.round(percentage * 100) / 100)
    );
  } else {
    this.progressPercentage = 0;
    if (this.totalUniqueWatchedSeconds > 0) {
      console.warn(
        `Cannot calculate progress percentage for video ${this.videoId}, user ${this.userId} because videoDuration is ${this.videoDuration}`
      );
    }
  }
};

videoProgressSchema.pre("save", function (next) {
  if (
    this.isModified("watchedIntervals") ||
    this.isModified("videoDuration") ||
    this.isModified("lastWatchedPosition")
  ) {
    if (
      this.isModified("watchedIntervals") ||
      this.isModified("videoDuration")
    ) {
      this.calculateProgress();
    }
  }
  next();
});

const VideoProgress = mongoose.model("VideoProgress", videoProgressSchema);

export default VideoProgress;
