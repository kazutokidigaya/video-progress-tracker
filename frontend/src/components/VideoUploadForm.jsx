import React, { useState } from "react";
import { uploadVideoApi } from "../services/api"; // Import the API function

const VideoUploadForm = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Optional progress state

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
    setSuccessMessage(null); // Clear previous messages
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !title) {
      setError("Please provide a title and select a video file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(0); // Reset progress

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("videoFile", videoFile); // 'videoFile' must match backend upload.single() name

    try {
      // --- Integrate Progress Tracking (Example) ---
      // Note: Axios progress requires specific config not shown in the basic api.js
      // You might need a dedicated axios instance or pass config here.
      // For now, we'll simulate or skip detailed progress.

      const uploadedVideo = await uploadVideoApi(
        formData /*, { onUploadProgress: event => ... } */
      );

      setSuccessMessage(
        `Video "${uploadedVideo.title}" uploaded successfully!`
      );
      setTitle("");
      setDescription("");
      setVideoFile(null);
      e.target.reset(); // Reset file input visually
      if (onUploadSuccess) {
        onUploadSuccess(uploadedVideo); // Notify parent component (e.g., to refresh list)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(100); // Indicate completion (or use actual progress)
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4">Upload New Video</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-gray-700 mb-1 font-medium"
          >
            Video Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-gray-700 mb-1 font-medium"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="mb-4">
          <label
            htmlFor="videoFile"
            className="block text-gray-700 mb-1 font-medium"
          >
            Video File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="videoFile"
            accept="video/*" // Accept only video files
            onChange={handleFileChange}
            className="w-full px-3 py-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          {videoFile && (
            <span className="text-sm text-gray-500 ml-2">{videoFile.name}</span>
          )}
        </div>

        {/* Optional Progress Bar */}
        {isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
};

export default VideoUploadForm;
