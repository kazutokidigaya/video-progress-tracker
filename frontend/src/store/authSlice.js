import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios"; // Use standard axios for auth calls initially

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

// --- Async Thunks for Auth ---

export const signupUserThunk = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const response = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        userData,
        config
      );
      // Store user info and token in localStorage on successful signup
      localStorage.setItem("userInfo", JSON.stringify(response.data));
      return response.data; // Contains user info and token
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Signup failed"
      );
    }
  }
);

export const loginUserThunk = createAsyncThunk(
  "auth/login",
  async (loginData, { rejectWithValue }) => {
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        loginData,
        config
      );
      // Store user info and token in localStorage on successful login
      localStorage.setItem("userInfo", JSON.stringify(response.data));
      return response.data; // Contains user info and token
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Login failed"
      );
    }
  }
);

// --- Initial State ---
// Check localStorage for existing user info on initial load
const userInfoFromStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;

const initialState = {
  user: userInfoFromStorage, // User object { _id, username, email, token }
  isAuthenticated: !!userInfoFromStorage,
  isLoading: false,
  error: null,
};

// --- Auth Slice ---
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Synchronous action for logout
    logout: (state) => {
      localStorage.removeItem("userInfo"); // Remove from localStorage
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      // Optionally reset other parts of the state (like progress) here or via listeners
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup Lifecycle
      .addCase(signupUserThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUserThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload; // Payload contains user info + token
      })
      .addCase(signupUserThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Login Lifecycle
      .addCase(loginUserThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
