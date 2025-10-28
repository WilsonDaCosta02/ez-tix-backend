const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  namaEvent: { type: String, required: true },
  deskripsi: { type: String },
  tanggal: { type: Date, required: true },
  lokasi: { type: String, required: true },
  kapasitas: { type: Number, required: true },
  hargaTiket: { type: Number, required: true },
  gambar: { type: String }, 
  penyelenggara: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
