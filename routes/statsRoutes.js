const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// hanya admin yang bisa melihat statistik
router.get("/overview/:eventId", authMiddleware, roleMiddleware(["admin"]), statsController.getOverviewStats);
router.get("/event/:eventId", authMiddleware, roleMiddleware(["admin"]), statsController.getEventStats);
router.get("/chart/:eventId", authMiddleware, roleMiddleware(["admin"]), statsController.getChartStats);

// ✅ HEADER GLOBAL (SEMUA EVENT)
router.get(
  "/global",
  authMiddleware,
  roleMiddleware(["admin"]),
  statsController.getGlobalStats
);

module.exports = router;
