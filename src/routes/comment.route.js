import express from "express";
import { body, validationResult } from "express-validator";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createComment,
  getComments,
  deleteComment,
  getReplies,
} from "../controllers/comment.controller.js";
import flash from "connect-flash";

const router = express.Router();

router.use(flash());

// Get top-level comments for a post
router.get("/post/:postId", getComments);

// Get replies to a specific comment
router.get("/replies/:commentId", getReplies);

// Create comment or reply (authenticated)
router.post(
  "/post/:postId",
  protectRoute,
  [
    body("comment")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Comment field cannot be empty!"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { postId } = req.params;

    if (errors.isEmpty()) {
      const { comment } = req.body;

      let commentObj = {
        postedBy: req.session.uid,
        postId,
        text: comment,
      };

      try {
        await new Comment(commentObj).save();
      } catch (er) {
        console.log(er.message);
      }
    } else {
      req.flash("error", `Failed to post a comment`);
    }

    res.redirect(`/${postId}#comment-field`);
  }
);

// Delete comment (authenticated)
router.delete("/:commentId", protectRoute, deleteComment);

export default router;
