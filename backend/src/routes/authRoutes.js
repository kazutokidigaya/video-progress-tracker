import express from "express";
import {
  signup,
  login,
  getUserProfile,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js"; // Import protect middleware

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
// Example protected route to test middleware
router.get("/profile", protect, getUserProfile);

export default router;
