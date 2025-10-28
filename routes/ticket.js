const express = require("express");
const { buyTicket, getMyTickets } = require("../controllers/ticketControllers");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protected
router.post("/buy", authMiddleware, buyTicket);
router.get("/my-tickets", authMiddleware, getMyTickets);

module.exports = router;
