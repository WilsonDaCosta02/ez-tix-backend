const multer = require("multer");
const path = require("path");

// konfigurasi storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder tempat nyimpen gambar
  },
filename: (req, file, cb) => {
  cb(
    null,
    Date.now() + "-" + file.originalname.replace(/\s+/g, "_")
  );
}
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Hanya gambar (jpeg, jpg, png) yang diizinkan"));
    }
  }
});

module.exports = upload;
