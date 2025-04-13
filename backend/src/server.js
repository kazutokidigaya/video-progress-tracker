import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import progressRoutes from "./routes/progressRoutes.js";
import authRoutes from "./routes/authRoutes.js"; // Import auth routes
import videoRoutes from "./routes/videoRoutes.js"; // Import video routes

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes); // Mount auth routes
app.use("/api/progress", progressRoutes); // Mount progress routes (now protected)
app.use("/api/videos", videoRoutes); // Mount video routes

// Simple Base Route
app.get("/", (req, res) => {
  res.send("Video Progress Tracker API Running");
});

// Basic Error Handling (Optional: add more specific error handlers)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () =>
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  )
);
