import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// Import API functions WITHOUT needing apiClient instance if interceptor handles token
import { fetchProgress, saveProgress } from "../services/api";
import { logout } from "./authSlice"; // Import logout action

// --- Async Thunks --- (No longer need userId passed in)

export const fetchProgressThunk = createAsyncThunk(
  "progress/fetchProgress",
  async ({ videoId }, { getState, rejectWithValue }) => {
    // Get videoId only
    // Ensure user is authenticated before fetching
    const { auth } = getState();
    if (!auth.isAuthenticated || !auth.user?.token) {
      return rejectWithValue("User not authenticated");
    }
    try {
      // API call doesn't need userId, token is sent via interceptor
      const data = await fetchProgress(videoId);
      return { ...data, videoDurationFromDB: data.videoDuration || 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch progress"
      );
    }
  }
);

export const saveProgressThunk = createAsyncThunk(
  "progress/saveProgress",
  async ({ videoId, payload }, { getState, rejectWithValue }) => {
    // Get videoId and payload
    const { auth, progress } = getState();
    if (!auth.isAuthenticated || !auth.user?.token) {
      return rejectWithValue("User not authenticated");
    }
    try {
      // Adjust payload duration check (logic remains similar)
      if (
        payload.videoDuration &&
        payload.videoDuration === progress.videoDurationFromDB
      ) {
        delete payload.videoDuration;
      }
      // API call doesn't need userId
      const data = await saveProgress(videoId, payload);
      return {
        ...data,
        ...(payload.videoDuration &&
          data.progressPercentage !== undefined && {
            videoDurationFromDB: payload.videoDuration,
          }),
      };
    } catch (error) {
      console.error("Error in saveProgressThunk:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to save progress"
      );
    }
  }
);

// --- Initial State --- (No longer needs userId/videoId/videoSrc here)
const initialState = {
  // videoId/videoSrc might be set by LecturePage based on routing param
  currentVideoId: null, // Track the currently active video ID

  isLoading: true,
  error: null,
  duration: 0,
  videoDurationFromDB: 0,
  currentTime: 0,
  isPlaying: false,
  watchedIntervals: [],
  progressPercentage: 0,
  lastKnownPosition: 0,
};

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    // Keep existing synchronous reducers
    setVideoMetadata: (state, action) => {
      state.duration = action.payload.duration;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    // Add reducer to set the active videoId and reset state
    setActiveVideo: (state, action) => {
      if (state.currentVideoId !== action.payload.videoId) {
        // Reset progress state when video changes
        state.currentVideoId = action.payload.videoId;
        state.isLoading = true;
        state.error = null;
        state.duration = 0;
        state.videoDurationFromDB = 0;
        state.currentTime = 0;
        state.isPlaying = false;
        state.watchedIntervals = [];
        state.progressPercentage = 0;
        state.lastKnownPosition = 0;
      }
      // You might also store videoSrc here if needed
    },
    // Clear progress state explicitly, e.g., on logout
    clearProgressState: (state) => {
      Object.assign(state, { ...initialState, currentVideoId: null }); // Reset to initial, clear videoId
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Progress Lifecycle
      .addCase(fetchProgressThunk.pending, (state, action) => {
        // Only set loading if it's for the current video
        if (state.currentVideoId === action.meta.arg.videoId) {
          state.isLoading = true;
          state.error = null;
        }
      })
      .addCase(fetchProgressThunk.fulfilled, (state, action) => {
        if (state.currentVideoId === action.meta.arg.videoId) {
          state.isLoading = false;
          state.watchedIntervals = action.payload.watchedIntervals || [];
          state.progressPercentage = action.payload.progressPercentage || 0;
          state.lastKnownPosition = action.payload.lastWatchedPosition || 0;
          state.videoDurationFromDB = action.payload.videoDurationFromDB || 0;
          // Don't necessarily reset currentTime here, let initial seek handle it
          // state.currentTime = action.payload.lastWatchedPosition || 0;
        }
      })
      .addCase(fetchProgressThunk.rejected, (state, action) => {
        if (state.currentVideoId === action.meta.arg.videoId) {
          state.isLoading = false;
          state.error = action.payload || "Failed to fetch progress";
          // Optionally reset state on failure
          state.watchedIntervals = [];
          state.progressPercentage = 0;
          state.lastKnownPosition = 0;
        }
      })
      // Save Progress Lifecycle (remains similar, just update state)
      .addCase(saveProgressThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(saveProgressThunk.fulfilled, (state, action) => {
        // Only update if the save was for the currently active video
        if (state.currentVideoId === action.meta.arg.videoId) {
          if (action.payload.watchedIntervals) {
            state.watchedIntervals = action.payload.watchedIntervals;
          }
          if (typeof action.payload.progressPercentage === "number") {
            state.progressPercentage = action.payload.progressPercentage;
          }
          if (typeof action.payload.videoDurationFromDB === "number") {
            state.videoDurationFromDB = action.payload.videoDurationFromDB;
          }
        }
      })
      .addCase(saveProgressThunk.rejected, (state, action) => {
        if (state.currentVideoId === action.meta.arg.videoId) {
          state.error = action.payload || "Failed to save progress";
          console.error("Save failed:", action.payload);
        }
      })
      // Listen for logout action from authSlice to clear progress
      .addCase(logout, (state) => {
        Object.assign(state, { ...initialState, currentVideoId: null }); // Reset progress on logout
      });
  },
});

export const {
  setVideoMetadata,
  setCurrentTime,
  setIsPlaying,
  setActiveVideo,
  clearProgressState, // Export if needed elsewhere
} = progressSlice.actions;
export default progressSlice.reducer;
