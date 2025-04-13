import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LecturePage from "./pages/LecturePage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminPage from "./pages/AdminPage";
import VideoListPage from "./pages/VideoListPage"; // 1. Import the new page
import "./index.css";

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        {" "}
        {/* Adjust padding if needed */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes (User + Admin) */}
          <Route element={<ProtectedRoute />}>
            {/* 2. Add route for the video list page */}
            <Route path="/lectures" element={<VideoListPage />} />
            <Route path="/lecture/:videoId" element={<LecturePage />} />
            {/* Other user routes */}
          </Route>

          {/* Admin Only Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
            {/* Other admin routes */}
          </Route>

          <Route
            path="*"
            element={
              <div className="text-center p-10">
                <h2>404 Not Found</h2>
              </div>
            }
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
