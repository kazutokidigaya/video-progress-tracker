import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Needed if you want to attach the full user object
import dotenv from "dotenv";

dotenv.config();

const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (Bearer TOKEN_STRING)
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user ID (from token payload) to the request object
      // Optionally, fetch user from DB (excluding password) and attach user object
      // req.user = await User.findById(decoded.id).select('-password'); // Example: attach full user
      req.user = { id: decoded.id }; // Attach only the user ID for simplicity

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" }); // User deleted after token issued?
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error("Token verification failed:", error.message);
      if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ message: "Not authorized, token failed (invalid)" });
      }
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Not authorized, token expired" });
      }
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

export default protect;
