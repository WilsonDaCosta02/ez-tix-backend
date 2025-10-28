const express = require("express");
const { register, registerAdmin, login, resetPassword, getProfile, updateProfile } = require("../controllers/authControllers");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", register);         // default user
router.post("/register-admin", registerAdmin); // khusus admin
router.post("/login", login);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
