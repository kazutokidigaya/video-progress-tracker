import { configureStore } from "@reduxjs/toolkit";
import progressReducer from "./progressSlice";
import authReducer from "./authSlice"; // Import the new auth reducer

export const store = configureStore({
  reducer: {
    auth: authReducer, // Add auth reducer
    progress: progressReducer,
  },
});
