import React, { useState, useEffect, useCallback } from "react";
import VideoUploadForm from "../components/VideoUploadForm";
import { listVideosApi, deleteVideoApi } from "../services/api"; // Import API functions
import { Link } from "react-router-dom";

const AdminPage = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch videos
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const videoList = await listVideosApi();
      setVideos(videoList);
    } catch (err) {
      setError(err.message || "Failed to fetch videos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Handler for successful upload (to refresh list)
  const handleUploadSuccess = (newVideo) => {
    // Add the new video to the top of the list for immediate feedback
    setVideos((prevVideos) => [
      {
        // Use structure returned by listVideosApi or create compatible one
        _id: newVideo._id,
        title: newVideo.title,
        videoId: newVideo.videoId,
        createdAt: newVideo.createdAt, // Assuming backend returns these
        duration: newVideo.duration,
      },
      ...prevVideos,
    ]);
    // Or simply refetch the whole list:
    // fetchVideos();
  };

  // Handler for deleting a video
  const handleDelete = async (dbId, title) => {
    if (
      window.confirm(
        `Are you sure you want to delete the video "${title}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteVideoApi(dbId);
        // Remove video from state
        setVideos((prevVideos) => prevVideos.filter((v) => v._id !== dbId));
        alert(`Video "${title}" deleted successfully.`);
      } catch (err) {
        alert(
          `Failed to delete video "${title}": ${
            err.response?.data?.message || err.message
          }`
        );
        setError(err.message || "Failed to delete video."); // Show error if needed
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Dashboard</h1>

      {/* Video Upload Section */}
      <VideoUploadForm onUploadSuccess={handleUploadSuccess} />

      {/* Video List Section */}
      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Manage Videos</h2>
        {isLoading && <p>Loading videos...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!isLoading && !error && videos.length === 0 && <p>No videos found.</p>}
        {!isLoading && !error && videos.length > 0 && (
          <ul className="space-y-3">
            {videos.map((video) => (
              <li
                key={video._id || video.videoId}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center border p-3 rounded hover:bg-gray-50"
              >
                <div>
                  <Link
                    to={`/lecture/${video.videoId}`}
                    className="text-lg font-medium text-blue-600 hover:underline"
                  >
                    {video.title}
                  </Link>
                  <p className="text-sm text-gray-600">ID: {video.videoId}</p>
                  <p className="text-xs text-gray-400">
                    Uploaded: {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(video._id, video.title)}
                  className="mt-2 sm:mt-0 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
