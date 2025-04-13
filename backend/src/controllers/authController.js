import User from "../models/User.js";
import generateToken from "../utils/generateToken.js"; // Or include jwt directly

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email or username" });
    }

    // 2. Create new user (password hashing handled by middleware in User model)
    const user = await User.create({
      username,
      email,
      password,
    });

    // 3. Generate JWT and send response
    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: token, // Send token to client
        role: user.role, // Include role
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Signup Error:", error);
    res
      .status(500)
      .json({ message: "Server error during signup", error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email/username and password" });
  }

  try {
    // 1. Find user by email or username, explicitly select password
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    }).select("+password"); // Need to explicitly select the password field

    // 2. Check if user exists and password is correct
    if (user && (await user.comparePassword(password))) {
      // 3. Generate JWT and send response
      const token = generateToken(user._id);
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: token,
        role: user.role, // Include role
      });
    } else {
      res.status(401).json({ message: "Invalid email/username or password" }); // Use 401 for auth failure
    }
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({ message: "Server error during login", error: error.message });
  }
};

// @desc    Get user profile (Example protected route)
// @route   GET /api/auth/profile
// @access  Private (requires token)
export const getUserProfile = async (req, res) => {
  // User ID is attached by the authMiddleware
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // Include role
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Get Profile Error:", error);
    res
      .status(500)
      .json({ message: "Server error fetching profile", error: error.message });
  }
};
