import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import progressRoutes from "./routes/progressRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: `${process.env.ORIGIN_URL}`,
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/videos", videoRoutes);

// Simple Base Route
app.get("/", (req, res) => {
  res.send("Video Progress Tracker API Running");
});

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
