// models/Ticket.js
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Data pemesan
    namaPemesan: { type: String, required: true },
    emailPemesan: { type: String, required: true },

    // Info tiket
    jumlah: { type: Number, required: true },
    totalHarga: { type: Number, required: true },

    // Pembayaran (sesuai UI: metode + no akun)
    paymentMethod: {
      type: String,
      enum: ["Dana", "Gopay", "Mandiri", "BCA"],
      required: true,
    },
    nomorAkun: { type: String, required: true },

    // Tambahan untuk halaman Tiketku
    paymentStatus: {
      type: String,
      enum: ["Berhasil", "Menunggu", "Gagal"],
      default: "Berhasil", // di project ini kita anggap langsung sukses
    },
    paymentId: {
      type: String, // contoh: PAY-1733479323-123
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // QR dan check-in
    qrCode: { type: String },
    statusCheckIn: {
      type: Boolean,
      default: false,
    },
    checkInAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);
