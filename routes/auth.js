const express = require("express");
const { register, login, resetPassword, getProfile, updateProfile } = require("../controllers/authControllers");
const  authMiddleware  = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);

// Protected route (hanya bisa diakses dengan token JWT)
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
