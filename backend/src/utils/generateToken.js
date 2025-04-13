import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // Ensure environment variables are loaded

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload: typically includes user ID
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" } // Use expiration from env or default
  );
};

export default generateToken;
