import User from "../models/User.js";

const admin = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      // Fetch the user from DB to check their role
      const user = await User.findById(req.user.id).select("+role");

      if (user && user.role === "admin") {
        next();
      } else {
        res
          .status(403)
          .json({ message: "Forbidden: Not authorized as an admin" });
      }
    } catch (error) {
      console.error("Admin Middleware Error:", error);
      res.status(500).json({ message: "Server error checking admin status" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, user not found" });
  }
};

export default admin;
