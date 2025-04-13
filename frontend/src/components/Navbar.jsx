import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Define base and active styles using Tailwind for NavLink
  const baseNavLinkClass =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
  const inactiveNavLinkClass =
    "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white";
  const activeNavLinkClass =
    "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"; // More distinct active style

  return (
    // Lighter background, bottom border, shadow
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex flex-shrink-0 items-center">
            {/* You can replace text with an SVG logo */}
            <Link
              to="/"
              className="text-2xl font-bold text-blue-600 dark:text-blue-400"
            >
              VidTrack
            </Link>
          </div>

          {/* Navigation Links (Centered) */}
          {/* Use hidden sm:flex to hide on small screens, adjust as needed for mobile menu */}
          <div className="hidden sm:flex sm:items-center sm:ml-6">
            <div className="flex space-x-4">
              <NavLink
                to="/"
                // Use end prop for home to only match exactly "/"
                end
                className={({ isActive }) =>
                  `${baseNavLinkClass} ${
                    isActive ? activeNavLinkClass : inactiveNavLinkClass
                  }`
                }
              >
                Home
              </NavLink>

              {isAuthenticated && (
                <NavLink
                  to="/lectures"
                  className={({ isActive }) =>
                    `${baseNavLinkClass} ${
                      isActive ? activeNavLinkClass : inactiveNavLinkClass
                    }`
                  }
                >
                  Lectures
                </NavLink>
              )}

              {/* Admin Link */}
              {isAuthenticated && user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `${baseNavLinkClass} ${
                      isActive ? activeNavLinkClass : inactiveNavLinkClass
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700 dark:text-gray-300 mr-4 hidden md:inline text-sm">
                  Hi, {user?.username}!
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <NavLink
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  // Slightly more prominent signup button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out"
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Consider adding a Mobile Menu implementation here for small screens */}
    </nav>
  );
};

export default Navbar;
