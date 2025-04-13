import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const HomePage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    // Add a subtle gradient background, ensure full height, use flex for centering
    <div className=" container mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] text-center bg-gradient-to-br from-white via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Content wrapper */}
      <div className="max-w-3xl">
        {/* Larger, bolder heading with more bottom margin */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
          Welcome to Video Progress Tracker
        </h1>
        {/* Slightly larger paragraph text, more margin */}
        <p className="text-lg sm:text-xl mb-10 text-gray-600 dark:text-gray-300">
          Track your unique watch time accurately and never lose your place.
        </p>

        {/* Call to action section */}
        {isAuthenticated ? (
          <Link
            to="/lectures" // Link to the video list page
            // Enhanced button styles with transition
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition duration-300 ease-in-out"
          >
            Browse Lectures
          </Link>
        ) : (
          // Enhanced text and link styles for login/signup prompt
          <p className="text-lg text-gray-700 dark:text-gray-400">
            Please{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-500 font-semibold hover:underline"
            >
              Login
            </Link>{" "}
            or{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-500 font-semibold hover:underline"
            >
              Sign Up
            </Link>{" "}
            to start.
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
