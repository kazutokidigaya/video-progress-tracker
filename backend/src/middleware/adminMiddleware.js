import User from "../models/User.js"; // Need User model to check role

const admin = async (req, res, next) => {
  // Assumes authMiddleware (protect) has already run and attached req.user
  if (req.user && req.user.id) {
    try {
      // Fetch the user from DB to check their role
      const user = await User.findById(req.user.id).select("+role"); // Select role field

      if (user && user.role === "admin") {
        next(); // User is admin, proceed
      } else {
        res
          .status(403)
          .json({ message: "Forbidden: Not authorized as an admin" }); // 403 Forbidden
      }
    } catch (error) {
      console.error("Admin Middleware Error:", error);
      res.status(500).json({ message: "Server error checking admin status" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, user not found" }); // Should be caught by protect middleware first
  }
};

export default admin;
