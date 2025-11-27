const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    namaEvent: { type: String, required: true },
    deskripsi: { type: String },
    tanggal: { type: Date, required: true },

    // ➕ TAMBAH INI
    waktu: { type: String, required: true }, // contoh: "09.00 WITA" atau "19.30 WIB"

    lokasi: { type: String, required: true },
    kapasitas: { type: Number, required: true },
    hargaTiket: { type: Number, required: true },
    gambar: { type: String },
    penyelenggara: { type: String, required: true },
    qrCode: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
