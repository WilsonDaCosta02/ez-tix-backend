const express = require("express");
const {
  register,
  registerAdmin,
  login,
  resetPassword,
  getProfile,
  updateProfile,
} = require("../controllers/authControllers");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware"); // ⬅️ tambahin ini

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/register-admin", registerAdmin);
router.post("/login", login);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", authMiddleware, getProfile);

// UPDATE PROFILE + FOTO
router.put(
  "/profile",
  authMiddleware,
  upload.single("profilePicture"), // ⬅️ FE kirim field ini
  updateProfile
);

module.exports = router;
