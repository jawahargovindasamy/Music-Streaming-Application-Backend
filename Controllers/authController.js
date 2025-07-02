import User from "../Models/userModel.js";
import Artist from "../Models/artistModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendEmail from "../Utils/mailer.js";
import { generateResetEmailTemplate } from "../Utils/emailTemplates.js";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const { password: _, ...userData } = newUser.toObject();

    res.status(201).json({
      message: "User registered successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      message: "Internal Server Error while registering user",
      error: error.message,
    });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    let artistId = null;
    let artistBio = null;
    if (user.role === "artist") {
      const artist = await Artist.findOne({ userID: user._id });
      if (artist) {
        artistId = artist._id;
        artistBio = artist.bio;
      }
    }

    res.status(200).json({
      message: "User logged in successfully",
      token: token,
      role: user.role,
      userId: user._id,
      artistId: artistId,
      bio: artistBio,
      username: user.username,
      profilePic: user.profilePic,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      location: user.location,
      likedSongs: user.likedSongs,
      likedAlbums: user.likedAlbums,
      followedArtists: user.followedArtists,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      message: "Internal Server Error while logging in user",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tokenExpiry = process.env.RESET_TOKEN_EXPIRY || "1h";
    const frontendUrl = "https://soniqueapp.netlify.app";
    const appName = process.env.APP_NAME || "Your Application";

    // Create a token valid for 1 hour
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: tokenExpiry,
    });

    // Use backticks and include correct reset link URL (frontend URL)
    const resetLink = `${frontendUrl}/reset-password/${user._id}/${token}`;

    const emailContent = generateResetEmailTemplate(
      user.username,
      resetLink,
      appName,
      tokenExpiry
    );

    await sendEmail(
      user.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );

    res.status(200).json({
      message: "Password reset link sent to your email",
      // Don't expose sensitive info in production
      ...(process.env.NODE_ENV === "development" && { resetLink }),
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error while processing forgot password",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;

    console.log(token);
    console.log(password);

    // Verify token
    try {
      const response = jwt.verify(token, process.env.JWT_SECRET);
      console.log(response);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token1" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error while resetting password",
      error: error.message,
    });
  }
};
