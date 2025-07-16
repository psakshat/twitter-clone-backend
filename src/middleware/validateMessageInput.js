export const validateMessageInput = (req, res, next) => {
  const { text, media } = req.body;

  // Ensure at least text or media is provided
  if (
    (text === undefined || text === null || text === "") &&
    (media === undefined || media === null || media === "")
  ) {
    return res.status(400).json({
      error: "Message must contain either text or media.",
    });
  }

  // Check that text, if present, is a string and not too long
  if (text && (typeof text !== "string" || text.length > 1000)) {
    return res.status(400).json({
      error: "Message text must be a string and not exceed 1000 characters.",
    });
  }

  next();
};
