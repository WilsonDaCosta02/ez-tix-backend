// routes/checkinRoutes.js
const express = require("express");
const router = express.Router();

const checkinController = require("../controllers/checkinController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// 🔶 Scan QR (global, 1 scanner untuk semua event)
router.post(
  "/scan",
  authMiddleware,
  roleMiddleware(["admin"]),
  checkinController.scanTicket
);

// 🔶 Hasil check-in per event (tabel di UI)
router.get(
  "/event/:eventId",
  authMiddleware,
  roleMiddleware(["admin"]),
  checkinController.getCheckinListByEvent
);

module.exports = router;
