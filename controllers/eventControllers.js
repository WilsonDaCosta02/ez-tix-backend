const Event = require("../models/Event");

// ===========================
// 🟢 CREATE EVENT
// ===========================
const createEvent = async (req, res) => {
  try {
    const { namaEvent, deskripsi, tanggal, lokasi, kapasitas, hargaTiket, gambar } = req.body;

    // Kalau ada file upload, ambil dari multer
    const gambarPath = req.file ? `/uploads/${req.file.filename}` : gambar || null;

    // Validasi dasar
    if (!namaEvent || !tanggal || !lokasi || !kapasitas || !hargaTiket) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const event = new Event({
      namaEvent,
      deskripsi,
      tanggal,
      lokasi,
      kapasitas,
      hargaTiket,
      gambar: gambarPath,
      penyelenggara: req.user.id
    });

    await event.save();
    res.status(201).json({ message: "Event berhasil dibuat", event });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// ===========================
// 🟡 UPDATE EVENT
// ===========================
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaEvent, deskripsi, tanggal, lokasi, kapasitas, hargaTiket, gambar } = req.body;

    // Ambil gambar baru kalau diupload
    const gambarPath = req.file ? `/uploads/${req.file.filename}` : gambar;

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        namaEvent,
        deskripsi,
        tanggal,
        lokasi,
        kapasitas,
        hargaTiket,
        ...(gambarPath && { gambar: gambarPath })
      },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }

    res.json({ message: "Event berhasil diperbarui", event: updatedEvent });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// ===========================
// 🔴 DELETE EVENT
// ===========================
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }

    res.json({ message: "Event berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// ===========================
// 🟣 GET ALL & GET BY ID
// ===========================
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("penyelenggara", "namaPengguna email");
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("penyelenggara", "namaPengguna email");
    if (!event) return res.status(404).json({ message: "Event tidak ditemukan" });

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

module.exports = { createEvent, updateEvent, deleteEvent, getAllEvents, getEventById };
