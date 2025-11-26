const Event = require("../models/Event");
const QRCode = require("qrcode");   // ⬅️ tambah ini

// ===========================
// 🟢 CREATE EVENT
// ===========================
const createEvent = async (req, res) => {
  try {
    const {
      namaEvent,
      deskripsi,
      tanggal,
      lokasi,
      kapasitas,
      hargaTiket,
      penyelenggara,
      gambar,
    } = req.body;

    const gambarPath = req.file ? `/uploads/${req.file.filename}` : gambar || null;

    if (!namaEvent || !tanggal || !lokasi || !kapasitas || !hargaTiket || !penyelenggara) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // 1. Buat event dulu
    const event = new Event({
      namaEvent,
      deskripsi,
      tanggal,
      lokasi,
      kapasitas,
      hargaTiket,
      gambar: gambarPath,
      penyelenggara,
    });

    await event.save();

    // 2. Generate QR Code berbasis eventId
    //    isi QR bebas, di sini pakai format "event:<id>"
    const qrString = `event:${event._id.toString()}`;
    const qrImage = await QRCode.toDataURL(qrString);

    // 3. Simpan QR ke field qrCode
    event.qrCode = qrImage;
    await event.save();

    res.status(201).json({ message: "Event berhasil dibuat", event });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

// ===========================
// 🟡 UPDATE EVENT
// ===========================
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      namaEvent,
      deskripsi,
      tanggal,
      lokasi,
      kapasitas,
      hargaTiket,
      penyelenggara,
      gambar,
    } = req.body;

    const gambarPath = req.file ? `/uploads/${req.file.filename}` : gambar || null;

    const dataToUpdate = {
      namaEvent,
      deskripsi,
      tanggal,
      lokasi,
      kapasitas,
      hargaTiket,
      penyelenggara,
    };

    if (gambarPath) {
      dataToUpdate.gambar = gambarPath;
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, dataToUpdate, {
      new: true,
      runValidators: true,
    });

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
    const events = await Event.find(); // ⬅️ TANPA populate
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id); // ⬅️ TANPA populate
    if (!event) return res.status(404).json({ message: "Event tidak ditemukan" });

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

module.exports = { createEvent, updateEvent, deleteEvent, getAllEvents, getEventById };
