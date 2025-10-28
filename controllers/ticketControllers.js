const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const QRCode = require("qrcode"); // ✅ import qrcode

// BELI TIKET
const buyTicket = async (req, res) => {
  try {
    // Cek role user
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admin tidak bisa membeli tiket" });
    }

    const { eventId, jumlah } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event tidak ditemukan" });

    // ✅ Cek apakah user sudah membeli tiket event ini
    const existing = await Ticket.findOne({ user: req.user.id, event: eventId });
    if (existing) {
      return res.status(400).json({ message: "Anda sudah membeli tiket untuk event ini" });
    }

    // ✅ Cek kapasitas/sold out
    if (event.kapasitas <= 0) {
      return res.status(400).json({ message: "Tiket sudah habis" });
    }

    if (jumlah > event.kapasitas) {
      return res.status(400).json({ message: "Jumlah tiket melebihi kapasitas" });
    }

    const totalHarga = jumlah * event.hargaTiket;

    const ticket = new Ticket({
      event: event._id,
      user: req.user.id,
      jumlah,
      totalHarga
    });
    await ticket.save();

    // ✅ Generate QR code
    const qrData = await QRCode.toDataURL(`${ticket._id}`);
    ticket.qrCode = qrData;
    await ticket.save();

    // Kurangi kapasitas event
    event.kapasitas -= jumlah;
    await event.save();

    res.status(201).json({ message: "Tiket berhasil dibeli", ticket });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// LIHAT TIKET USER
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate("event", "namaEvent tanggal lokasi gambar");
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

module.exports = { buyTicket, getMyTickets };
