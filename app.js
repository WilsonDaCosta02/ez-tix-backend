const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/event");
const ticketRoutes = require("./routes/ticket");
const path = require("path");
const userRoutes = require("./routes/users");
const statsRoutes = require("./routes/statsRoutes");


const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);

app.use("/api/users", userRoutes);

// upload images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/checkin", require("./routes/checkinRoutes"));
app.use("/api/stats", statsRoutes);


module.exports = app;
