import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Invalid email"],
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      // Added Role field
      type: String,
      enum: ["user", "admin"], // Allowed roles
      default: "user", // Default role is 'user'
    },
  },
  { timestamps: true }
);

// Pre-save hook for password hashing (remains the same)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method for password comparison (remains the same)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
