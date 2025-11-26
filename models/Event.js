const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    namaEvent: { type: String, required: true },
    deskripsi: { type: String },
    tanggal: { type: Date, required: true },
    lokasi: { type: String, required: true },
    kapasitas: { type: Number, required: true },
    hargaTiket: { type: Number, required: true },
    gambar: { type: String },      // URL / path poster
    penyelenggara: { type: String, required: true }, // nama klien
    qrCode: { type: String },      // 👉 base64 gambar QR event
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
