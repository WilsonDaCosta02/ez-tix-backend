const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/event");
const ticketRoutes = require("./routes/ticket");
const path = require("path");


const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);

// upload images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

module.exports = app;
