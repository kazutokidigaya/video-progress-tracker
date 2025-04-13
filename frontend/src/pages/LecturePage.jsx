import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setActiveVideo } from "../store/progressSlice";
import { getVideoDetailsApi } from "../services/api";
import VideoPlayer from "../components/VideoPlayer";

const LecturePage = () => {
  const { videoId } = useParams();
  const dispatch = useDispatch();

  const [videoSrc, setVideoSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");

  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) return;
      setIsLoading(true);
      setError(null);
      setVideoSrc(null);
      setVideoTitle("");
      dispatch(setActiveVideo({ videoId }));
      try {
        const videoDetails = await getVideoDetailsApi(videoId);
        if (videoDetails && videoDetails.cloudinaryUrl) {
          setVideoSrc(videoDetails.cloudinaryUrl);
          setVideoTitle(videoDetails.title);
        } else {
          setError("Video details not found or missing URL.");
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load video details."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideoData();
  }, [videoId, dispatch]);

  return (
    // Add page background and padding

    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-8 sm:py-12">
      <div className="container mx-auto px-4">
        {/* Styled Title Area */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            {isLoading
              ? "Loading Lecture..."
              : error
              ? "Error"
              : videoTitle || videoId}{" "}
            {/* Show title or ID */}
          </h1>
          {/* Optional: Subtitle or breadcrumbs could go here */}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            Loading video player...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-10 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-4 rounded max-w-md mx-auto">
            Error loading video: {error}
          </div>
        )}

        {/* Video Player (Renders when ready and no error) */}
        {/* VideoPlayer component itself contains max-width and internal styling */}
        {!isLoading && !error && videoSrc && (
          <VideoPlayer videoSrc={videoSrc} />
        )}

        {/* State when video source couldn't be loaded but there wasn't a specific fetch error */}
        {!isLoading && !error && !videoSrc && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            Could not load video source.
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturePage;
