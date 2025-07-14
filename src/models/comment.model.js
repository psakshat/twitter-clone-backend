import mongoose from "mongoose";

const { Schema } = mongoose;

const commentSchema = new Schema({
  postedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  postId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Post",
  },
  text: {
    type: String,
    required: true,
    maxLength: 280,
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  commentedAt: {
    type: Date,
    default: Date.now,
  },
  replies: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

commentSchema.pre("find", function (next) {
  this.populate({
    path: "replies",
    populate: { path: "postedBy" },
  });
  next();
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
