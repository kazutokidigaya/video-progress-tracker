import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js"; // Your configured Cloudinary instance
import {
  uploadVideo,
  listVideos,
  getVideoDetails,
  deleteVideo,
} from "../controllers/videoController.js";
import protect from "../middleware/authMiddleware.js";
import admin from "../middleware/adminMiddleware.js";

const router = express.Router();

// --- Multer Configuration for Cloudinary ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Basic validation or parameter setting based on request
    let folder = "video_lectures"; // Folder in Cloudinary
    let resource_type = "video"; // Ensure Cloudinary treats it as video
    // Example: Use user ID in folder structure? (req.user should be available)
    // folder = `video_lectures/${req.user.id}`;
    return {
      folder: folder,
      resource_type: resource_type,
      // public_id: file.originalname.split('.')[0], // Optional: define custom public_id
      allowed_formats: ["mp4", "mov", "avi", "mkv", "webm"], // Specify allowed formats
      // transformation: [{ width: 1280, height: 720, crop: "limit" }] // Optional: transformations
    };
  },
});

// Configure Multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 500 }, // Example limit: 500MB - Adjust as needed!
  fileFilter: (req, file, cb) => {
    // Example file type filter
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Not a video file!"), false);
    }
  },
});

// --- Video Routes ---

// POST /api/videos/upload - Upload new video (Admin Only)
// 'videoFile' should match the name attribute of your file input field in the frontend form
router.post(
  "/upload",
  protect, // 1. Check login
  admin, // 2. Check if admin
  upload.single("videoFile"), // 3. Handle file upload using multer/cloudinary
  uploadVideo // 4. Process metadata and save to DB
);

// GET /api/videos - List all video metadata (Public or Protected)
router.get("/", listVideos); // Decide if 'protect' is needed here

// GET /api/videos/:videoId - Get single video details (Public or Protected)
router.get("/:videoId", getVideoDetails); // Decide if 'protect' is needed here

// DELETE /api/videos/:id - Delete video by DB _id (Admin Only)
router.delete(
  "/:id",
  protect, // 1. Check login
  admin, // 2. Check if admin
  deleteVideo // 3. Delete from Cloudinary & DB
);

export default router;
