const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jumlah: { type: Number, required: true },
  totalHarga: { type: Number, required: true },
  qrCode: { type: String }, // ✅ Tambahkan ini
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
