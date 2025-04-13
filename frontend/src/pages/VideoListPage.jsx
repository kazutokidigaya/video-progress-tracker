import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { listVideosApi } from "../services/api"; // Import the API function

const VideoListPage = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [error, setError] = useState(null);

  // Function to fetch videos using useCallback to avoid re-creation on every render
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const videoList = await listVideosApi();
      setVideos(videoList || []); // Ensure videos is always an array
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch videos."
      );
      setVideos([]); // Clear videos on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  // Fetch videos when the component mounts
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]); // Depend on the memoized fetchVideos function

  // Helper function to format duration (optional)
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="container mx-auto px-4 py-8 ">
      <h1 className="text-3xl font-bold text-center mb-8">
        Available Lectures
      </h1>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center text-gray-500">Loading lectures...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded">
          Error loading lectures: {error}
        </div>
      )}

      {/* Video List */}
      {!isLoading && !error && videos.length === 0 && (
        <div className="text-center text-gray-500">
          No lectures available at the moment.
        </div>
      )}

      {!isLoading && !error && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.videoId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* You could add thumbnails here later */}
              <div className="p-5">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {/* Link uses the correct videoId */}
                  <Link
                    to={`/lecture/${video.videoId}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {video.title || "Untitled Lecture"}
                  </Link>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {video.description || "No description available."}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                  <span>ID: {video.videoId}</span>
                  {video.duration > 0 && (
                    <span>Duration: {formatDuration(video.duration)}</span>
                  )}
                  {video.createdAt && (
                    <span>
                      Uploaded: {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    to={`/lecture/${video.videoId}`}
                    className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded transition-colors"
                  >
                    Watch Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoListPage;
