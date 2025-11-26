const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const QRCode = require("qrcode"); // ✅ import qrcode

// BELI TIKET
const buyTicket = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admin tidak bisa membeli tiket" });
    }

    const { eventId, jumlah, namaLengkap, email, paymentMethod, nomorAkun } = req.body;

    // ubah jumlah ke integer
    const qty = parseInt(jumlah, 10);

    // validasi basic form
    if (!namaLengkap || !email) {
      return res.status(400).json({ message: "Nama lengkap dan email wajib diisi" });
    }

    if (!paymentMethod || !nomorAkun) {
      return res.status(400).json({ message: "Metode pembayaran dan nomor akun wajib diisi" });
    }

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Jumlah tiket harus lebih dari 0" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }

    if (event.kapasitas <= 0) {
      return res.status(400).json({ message: "Tiket sudah habis" });
    }

    if (qty > event.kapasitas) {
      return res.status(400).json({ message: "Jumlah tiket melebihi kapasitas" });
    }

    const totalHarga = qty * event.hargaTiket;

    const ticket = new Ticket({
      event: event._id,
      user: req.user.id,

      namaPemesan: namaLengkap,
      emailPemesan: email,

      jumlah: qty,
      totalHarga,

      paymentMethod,
      nomorAkun
    });
    await ticket.save();

    const qrData = await QRCode.toDataURL(`${ticket._id}`);
    ticket.qrCode = qrData;
    await ticket.save();

    event.kapasitas -= qty;
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
