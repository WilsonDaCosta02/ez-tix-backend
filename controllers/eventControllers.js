const { get } = require("mongoose");
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
      waktu,          // ➕ ambil waktu dari body
      lokasi,
      kapasitas,
      hargaTiket,
      penyelenggara,
      gambar,
    } = req.body;

    const gambarPath = req.file ? `/uploads/${req.file.filename}` : gambar || null;

    if (!namaEvent || !tanggal || !waktu || !lokasi || !kapasitas || !hargaTiket || !penyelenggara) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const event = new Event({
      namaEvent,
      deskripsi,
      tanggal,
      waktu,        // ➕ simpan waktu
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
      waktu,          // ➕ ambil waktu
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
      waktu,        // ➕ update waktu
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Cari dulu 3 event terakhir (yang dipakai di rekomendasi)
    const recommended = await Event.find({
      tanggal: { $gte: today },
    })
      .sort({ tanggal: -1 })  // paling jauh dulu
      .limit(3)
      .select("_id");          // cuma ambil _id

    const recommendedIds = recommended.map(ev => ev._id);

    // 2. Ambil semua event upcoming KECUALI 3 rekomendasi
    const events = await Event.find({
      tanggal: { $gte: today },          // hanya event yang belum lewat
      _id: { $nin: recommendedIds },     // exclude 3 rekomendasi
    }).sort({ tanggal: 1 });             // urut dari yang paling dekat

    res.json({ events });
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: err.message,
    });
  }
};

// ===========================
// 🟣 GET SEMUA EVENTS (HALAMAN "ACARA")
// ===========================
const getAllEventsForAcaraPage = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Semua event yang belum lewat, TANPA exclude 3 rekomendasi
    const events = await Event.find({
      tanggal: { $gte: today },
    }).sort({ tanggal: 1 });   // urut dari tanggal terdekat

    res.json({ events });
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: err.message,
    });
  }
};


// ===========================
// 🟣 GET EVENT BY ID
// ===========================
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }

    res.json({ event });
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: err.message,
    });
  }
};

// ===============================
// 🎯 Rekomendasi Acara (3 terdekat)
// ===============================
const getRecommendedEvents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Ambil event yang belum lewat, sort DESC (tanggal paling jauh dulu)
    let events = await Event.find({
      tanggal: { $gte: today },
    })
      .sort({ tanggal: -1 }) // DESC → paling jauh ke depan
      .limit(3);             // ambil 3 PALING akhir

    // 2. Supaya di UI tetap dari yang lebih dekat → sort lagi naik di JS
    events = events.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    res.json(events);
  } catch (err) {
    console.error("Error getRecommendedEvents:", err);
    res.status(500).json({
      message: "Gagal memuat rekomendasi acara",
      error: err.message,
    });
  }
};


module.exports = { createEvent, updateEvent, deleteEvent, getAllEvents, getEventById, getRecommendedEvents, getAllEventsForAcaraPage };
