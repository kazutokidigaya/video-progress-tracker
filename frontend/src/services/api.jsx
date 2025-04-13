import axios from "axios";
import { store } from "../store/store.js"; // Import store to access state

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Axios Request Interceptor ---
// Automatically add the Authorization header if user is logged in
apiClient.interceptors.request.use(
  (config) => {
    // Get the current state from the Redux store
    const state = store.getState();
    const user = state.auth.user; // Access user info from auth slice

    if (user && user.token) {
      config.headers["Authorization"] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Progress API Functions --- (Updated: No longer need userId passed in)

/**
 * Fetches video progress for the logged-in user.
 * @param {string} videoId
 * @returns {Promise<object>} Progress data or default state.
 */
export const fetchProgress = async (videoId) => {
  try {
    // The interceptor adds the token, backend identifies the user
    const response = await apiClient.get(`/progress/${videoId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching progress for ${videoId}:`,
      error.response ? error.response.data : error.message
    );
    return {
      watchedIntervals: [],
      totalUniqueWatchedSeconds: 0,
      progressPercentage: 0,
      lastWatchedPosition: 0,
      videoDuration: 0,
      message: "Failed to fetch progress.",
    };
  }
};

/**
 * Updates video progress for the logged-in user.
 * @param {string} videoId
 * @param {object} payload - Contains { interval?: {start, end}, lastWatchedPosition?: number, videoDuration?: number }
 * @returns {Promise<object>} Updated progress data from backend.
 */
export const saveProgress = async (videoId, payload) => {
  try {
    // Interceptor adds token
    const response = await apiClient.post(`/progress/${videoId}`, payload);
    return response.data;
  } catch (error) {
    console.error(
      `Error saving progress for ${videoId}:`,
      error.response ? error.response.data : error.message
    );
    throw error; // Re-throw for thunk to handle
  }
};

// Note: Auth API calls (signup, login) are handled directly in authSlice thunks using axios
// to avoid potential circular dependencies and manage localStorage directly upon success.

// ... (apiClient setup and interceptor remain the same) ...

// --- Video API Functions ---

/**
 * Uploads a new video file along with metadata.
 * @param {FormData} formData - Should contain title, description, videoFile
 * @returns {Promise<object>} Metadata of the uploaded video.
 */
export const uploadVideoApi = async (formData) => {
  try {
    // Let interceptor handle auth token
    const response = await apiClient.post("/videos/upload", formData, {
      headers: {
        // Important: Let browser set Content-Type for FormData
        "Content-Type": "multipart/form-data",
      },
      // Optional: Add progress tracking for uploads
      // onUploadProgress: progressEvent => { ... }
    });
    return response.data;
  } catch (error) {
    console.error(
      "Video Upload API Error:",
      error.response ? error.response.data : error.message
    );
    throw error; // Re-throw for component/thunk handling
  }
};

/**
 * Fetches the list of video metadata.
 * @returns {Promise<Array>} Array of video objects.
 */
export const listVideosApi = async () => {
  try {
    // Let interceptor handle auth token if route is protected
    const response = await apiClient.get("/videos");
    return response.data;
  } catch (error) {
    console.error(
      "List Videos API Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

/**
 * Fetches details for a single video by its videoId (slug).
 * @param {string} videoId
 * @returns {Promise<object>} Video details object.
 */
export const getVideoDetailsApi = async (videoId) => {
  try {
    // Let interceptor handle auth token if route is protected
    const response = await apiClient.get(`/videos/${videoId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Get Video Details API Error for ${videoId}:`,
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

/**
 * Deletes a video by its MongoDB _id.
 * @param {string} dbId - The MongoDB _id of the video record.
 * @returns {Promise<object>} Success message.
 */
export const deleteVideoApi = async (dbId) => {
  try {
    // Let interceptor handle auth token (needed for protected admin route)
    const response = await apiClient.delete(`/videos/${dbId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Delete Video API Error for ID ${dbId}:`,
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export default apiClient;
