const express = require("express");
const { createEvent, updateEvent, deleteEvent, getAllEvents, getEventById } = require("../controllers/eventControllers");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public
router.get("/", getAllEvents);
router.get("/:id", getEventById);

// Admin create event with image
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  upload.single("gambar"),
  createEvent
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  upload.single("gambar"),
  updateEvent
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEvent
);

module.exports = router;
