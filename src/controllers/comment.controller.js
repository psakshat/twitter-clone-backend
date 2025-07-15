import asyncHandler from "express-async-handler";
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";

// Recursive function to get all nested replies for a comment
const getNestedReplies = async (parentId) => {
  const replies = await Comment.find({ parentComment: parentId })
    .sort({ createdAt: 1 })
    .populate("user", "username firstName lastName profilePicture")
    .lean();

  return Promise.all(
    replies.map(async (reply) => {
      reply.replies = await getNestedReplies(reply._id);
      return reply;
    })
  );
};

// GET all top-level comments with nested replies
export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId, parentComment: null })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .lean();

  const withNestedReplies = await Promise.all(
    comments.map(async (comment) => {
      comment.replies = await getNestedReplies(comment._id);
      return comment;
    })
  );

  res.status(200).json({ comments: withNestedReplies });
});

// POST: Create a comment or a reply
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

  let parent = null;
  if (parentComment) {
    parent = await Comment.findById(parentComment);
    if (!parent)
      return res.status(404).json({ error: "Parent comment not found" });
  }

  const comment = await Comment.create({
    user: user._id,
    post: postId,
    content,
    parentComment: parent?._id || null,
  });

  await Post.findByIdAndUpdate(postId, {
    $push: { comments: comment._id },
  });

  const notifyTo = parent ? parent.user : post.user;
  if (notifyTo.toString() !== user._id.toString()) {
    await Notification.create({
      from: user._id,
      to: notifyTo,
      type: parent ? "reply" : "comment",
      post: postId,
      comment: comment._id,
    });
  }

  res.status(201).json({ comment });
});

// Recursive function to delete nested replies
const deleteRepliesRecursively = async (commentId) => {
  const replies = await Comment.find({ parentComment: commentId });

  for (const reply of replies) {
    await deleteRepliesRecursively(reply._id);
    await Comment.findByIdAndDelete(reply._id);
  }
};

// DELETE a comment and all nested replies
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

  await deleteRepliesRecursively(commentId);

  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: commentId },
  });

  await Comment.findByIdAndDelete(commentId);

  res
    .status(200)
    .json({ message: "Comment and all nested replies deleted successfully" });
});

// GET direct replies only (useful for lazy loading/pagination)
export const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const replies = await Comment.find({ parentComment: commentId })
    .sort({ createdAt: 1 })
    .populate("user", "username firstName lastName profilePicture");

  res.status(200).json({ replies });
});
