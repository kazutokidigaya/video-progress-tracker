import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  listVideosApi,
  getVideoDetailsApi,
  // You might add uploadVideoApi, deleteVideoApi calls here too if managing their state globally
} from "../services/api"; // Adjust path as needed

// --- Async Thunks ---

export const listVideosThunk = createAsyncThunk(
  "videos/listAll",
  async (_, { rejectWithValue }) => {
    // No arguments needed for listing all
    try {
      const videos = await listVideosApi();
      return videos; // Payload will be the array of videos
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch video list"
      );
    }
  }
);

export const getVideoDetailsThunk = createAsyncThunk(
  "videos/getDetails",
  async (videoId, { rejectWithValue }) => {
    // Takes videoId as argument
    if (!videoId) return rejectWithValue("No videoId provided");
    try {
      const videoDetails = await getVideoDetailsApi(videoId);
      return videoDetails; // Payload will be the single video object
    } catch (error) {
      // Handle 404 specifically?
      if (error.response?.status === 404) {
        return rejectWithValue(`Video with ID '${videoId}' not found.`);
      }
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          `Failed to fetch details for video ${videoId}`
      );
    }
  }
);

// --- Initial State ---

const initialState = {
  videoList: [], // Array to store the list of video metadata
  currentVideoDetails: null, // Object to store details of the currently viewed video
  isLoadingList: false, // Loading state for the list
  isLoadingDetails: false, // Loading state for the details view
  errorList: null, // Error state for the list
  errorDetails: null, // Error state for the details view
};

// --- Video Slice Definition ---

const videoSlice = createSlice({
  name: "videos",
  initialState,
  reducers: {
    // Optional: Synchronous reducers if needed, e.g., to clear details when navigating away
    clearCurrentVideoDetails: (state) => {
      state.currentVideoDetails = null;
      state.isLoadingDetails = false;
      state.errorDetails = null;
    },
    clearVideoList: (state) => {
      state.videoList = [];
      state.isLoadingList = false;
      state.errorList = null;
    },
    // Reducer to potentially update list after successful upload/delete if not refetching
    // addVideoToList: (state, action) => { state.videoList.unshift(action.payload); },
    // removeVideoFromList: (state, action) => { state.videoList = state.videoList.filter(v => v._id !== action.payload); },
  },
  extraReducers: (builder) => {
    builder
      // --- List Videos Lifecycle ---
      .addCase(listVideosThunk.pending, (state) => {
        state.isLoadingList = true;
        state.errorList = null;
      })
      .addCase(listVideosThunk.fulfilled, (state, action) => {
        state.isLoadingList = false;
        state.videoList = action.payload; // Replace list with fetched data
      })
      .addCase(listVideosThunk.rejected, (state, action) => {
        state.isLoadingList = false;
        state.errorList = action.payload; // Store error message
        state.videoList = []; // Clear list on error
      })
      // --- Get Video Details Lifecycle ---
      .addCase(getVideoDetailsThunk.pending, (state) => {
        state.isLoadingDetails = true;
        state.errorDetails = null;
        state.currentVideoDetails = null; // Clear previous details while loading new ones
      })
      .addCase(getVideoDetailsThunk.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.currentVideoDetails = action.payload; // Store fetched details
      })
      .addCase(getVideoDetailsThunk.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.errorDetails = action.payload; // Store error message
        state.currentVideoDetails = null; // Clear details on error
      });
    // Add cases for upload/delete thunks here if you create them
  },
});

// Export actions and reducer
export const { clearCurrentVideoDetails, clearVideoList } = videoSlice.actions;
export default videoSlice.reducer;
