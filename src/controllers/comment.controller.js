import asyncHandler from "express-async-handler";
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";

// GET TOP-LEVEL COMMENTS
export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  // Validate post exists
  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const comments = await Comment.find({ post: postId, parentComment: null })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture");

  res.status(200).json({ comments });
});

// CREATE COMMENT OR REPLY
export const createComment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { postId } = req.params;
  const { content, parentComment } = req.body;

  if (!user) return res.status(401).json({ error: "User not authenticated" });

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Comment content is required" });
  }

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  // If parentComment is provided, validate it exists
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent) {
      return res.status(404).json({ error: "Parent comment not found" });
    }
    // Ensure the parent comment belongs to the same post
    if (parent.post.toString() !== postId) {
      return res
        .status(400)
        .json({ error: "Parent comment does not belong to this post" });
    }
  }

  const comment = await Comment.create({
    user: user._id,
    post: postId,
    content: content.trim(),
    parentComment: parentComment || null,
  });

  // Populate the user field for the response
  await comment.populate("user", "username firstName lastName profilePicture");

  // Add comment to post's comments array (only for top-level comments)
  if (!parentComment) {
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });
  }

  // Create notification
  const notifyTo = parentComment
    ? (await Comment.findById(parentComment)).user
    : post.user;

  if (notifyTo.toString() !== user._id.toString()) {
    await Notification.create({
      from: user._id,
      to: notifyTo,
      type: parentComment ? "reply" : "comment",
      post: postId,
      comment: comment._id,
    });
  }

  res.status(201).json({ comment });
});

// DELETE COMMENT (AND ITS REPLIES)
export const deleteComment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { commentId } = req.params;

  if (!user) return res.status(401).json({ error: "User not authenticated" });

  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  if (comment.user.toString() !== user._id.toString()) {
    return res
      .status(403)
      .json({ error: "You can only delete your own comments" });
  }

  // Remove comment from post's comments array (only for top-level comments)
  if (!comment.parentComment) {
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId },
    });
  }

  // Delete the comment and all its replies
  await Comment.findByIdAndDelete(commentId);
  await Comment.deleteMany({ parentComment: commentId }); // cascade delete replies

  // Delete related notifications
  await Notification.deleteMany({ comment: commentId });

  res
    .status(200)
    .json({ message: "Comment and its replies deleted successfully" });
});

// GET REPLIES TO A COMMENT
export const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // Validate parent comment exists
  const parentComment = await Comment.findById(commentId);
  if (!parentComment) {
    return res.status(404).json({ error: "Parent comment not found" });
  }

  const replies = await Comment.find({ parentComment: commentId })
    .sort({ createdAt: 1 }) // Replies in chronological order
    .populate("user", "username firstName lastName profilePicture");

  res.status(200).json({ replies });
});

// LIKE/UNLIKE COMMENT (bonus feature)
export const likeComment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { commentId } = req.params;

  if (!user) return res.status(401).json({ error: "User not authenticated" });

  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const isLiked = comment.likes.includes(user._id);

  if (isLiked) {
    // Unlike the comment
    comment.likes = comment.likes.filter(
      (id) => id.toString() !== user._id.toString()
    );
  } else {
    // Like the comment
    comment.likes.push(user._id);
  }

  await comment.save();

  res.status(200).json({
    message: isLiked ? "Comment unliked" : "Comment liked",
    likes: comment.likes.length,
  });
});
