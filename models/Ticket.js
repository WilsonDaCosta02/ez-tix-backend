const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // data pemesan dari form
  namaPemesan:  { type: String, required: true },
  emailPemesan: { type: String, required: true },

  jumlah:     { type: Number, required: true },
  totalHarga: { type: Number, required: true },

  // 🆕 data dari popup metode pembayaran
  paymentMethod: {
    type: String,
    enum: ["Dana", "Gopay", "Mandiri", "BCA"],
    required: true
  },
  nomorAkun: { type: String, required: true },

  qrCode: { type: String }, // QR untuk check-in

  // 🔥 FIELD CHECK-IN
    isCheckedIn: { type: Boolean, default: false },
    checkInTime: { type: Date },
    checkInBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin yg scan
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
