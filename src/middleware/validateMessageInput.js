export const validateMessageInput = (req, res, next) => {
  const { text, media } = req.body;
  if (!text && !media) {
    return res
      .status(400)
      .json({ error: "Message must contain text or media" });
  }
  if (text && text.length > 1000) {
    return res.status(400).json({ error: "Message text too long" });
  }
  next();
};
