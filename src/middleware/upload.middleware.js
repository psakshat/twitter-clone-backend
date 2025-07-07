// multer is a middleware for handling multipart/form-data, which is primarily used for file uploads

import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, res, cb) => {
  if (fileFilter.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("only image files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export default upload;
