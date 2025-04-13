import express from "express";
import {
  getProgress,
  updateProgress,
} from "../controllers/progressController.js";
import protect from "../middleware/authMiddleware.js"; // Import protect middleware

const router = express.Router();

// Apply the 'protect' middleware to all progress routes
// The user ID will now come from req.user.id (attached by the middleware)
// The route no longer needs the :userId parameter

// Route to get progress for the logged-in user and specific video
// GET /api/progress/:videoId
router.get("/:videoId", protect, getProgress);

// Route to update progress for the logged-in user and specific video
// POST /api/progress/:videoId
router.post("/:videoId", protect, updateProgress);

export default router;
