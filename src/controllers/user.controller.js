import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// Get public user profile by username (no auth needed)
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

// Update current user's profile (protected)
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from JWT middleware

  const user = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

// This function is not needed anymore, since syncing from Clerk is removed.
// You can either delete it or repurpose it for something else.
export const syncUser = asyncHandler(async (req, res) => {
  // If you want, you can remove this function completely.
  // Or just return the current user info:
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user, message: "User synced successfully" });
});

// Get current user profile (protected)
export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

// Follow/unfollow user (protected)
export const followUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { targetUserId } = req.params;

  if (userId.toString() === targetUserId)
    return res.status(400).json({ error: "You cannot follow yourself" });

  const currentUser = await User.findById(userId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser)
    return res.status(404).json({ error: "User not found" });

  const isFollowing = currentUser.following.includes(targetUserId);

  if (isFollowing) {
    // unfollow
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUser._id },
    });
  } else {
    // follow
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUser._id },
    });

    // create notification
    await Notification.create({
      from: currentUser._id,
      to: targetUserId,
      type: "follow",
    });
  }

  res.status(200).json({
    message: isFollowing
      ? "User unfollowed successfully"
      : "User followed successfully",
  });
});

// Get all users (basic info only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, "_id username profilePicture").lean();
  res.status(200).json(users);
});
