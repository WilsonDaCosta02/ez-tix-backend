const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const QRCode = require("qrcode"); // ✅ import qrcode
const nodemailer = require("nodemailer");

// transporter email (sekali buat, dipakai semua request)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// BELI TIKET
const buyTicket = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admin tidak bisa membeli tiket" });
    }

    const { eventId, jumlah, namaLengkap, email, paymentMethod, nomorAkun } = req.body;

    // parse jumlah
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

    // 1. Simpan tiket
    const ticket = new Ticket({
      event: event._id,
      user: req.user.id,

      namaPemesan: namaLengkap,
      emailPemesan: email,

      jumlah: qty,
      totalHarga,

      paymentMethod,
      nomorAkun,
    });
    await ticket.save();

    // 2. Generate QR untuk tiket ini (1 QR mewakili semua tiket di transaksi ini)
    // QR untuk disimpan di DB (optional kalau kamu mau tetap simpan base64)
    const qrBuffer = await QRCode.toBuffer(`${ticket._id}`);

    // simpan base64 di DB seperti sebelumnya (biar FE bisa pakai juga)
    ticket.qrCode = `data:image/png;base64,${qrBuffer.toString("base64")}`;
    await ticket.save();


    // 3. Kurangi kapasitas event
    event.kapasitas -= qty;
    await event.save();

    // 4. Kirim email e-ticket ke pembeli
    try {
      await transporter.sendMail({
        from: `"Ez-Tix" <${process.env.EMAIL_USER}>`,
        to: ticket.emailPemesan,
        subject: `E-Ticket ${event.namaEvent}`,
        html: `
          <h2>Terima kasih, kamu berhasil membeli tiket!</h2>
          <p>Berikut detail pesananmu:</p>
          <ul>
            <li><b>Nama Event:</b> ${event.namaEvent}</li>
            <li><b>Tanggal:</b> ${event.tanggal.toDateString()}</li>
            <li><b>Lokasi:</b> ${event.lokasi}</li>
            <li><b>Nama Pemesan:</b> ${ticket.namaPemesan}</li>
            <li><b>Jumlah Tiket:</b> ${ticket.jumlah}</li>
            <li><b>Total Bayar:</b> Rp ${ticket.totalHarga.toLocaleString("id-ID")}</li>
            <li><b>Metode Pembayaran:</b> ${ticket.paymentMethod}</li>
          </ul>
          <p>Silakan tunjukkan QR code berikut saat check-in di lokasi event:</p>

          <!-- perhatikan: pakai cid, bukan data:image -->
          <img src="cid:qr-ticket-${ticket._id}" alt="QR Code Ticket" />

          <p>ID Tiket: ${ticket._id}</p>
          <p>QR ini berlaku untuk <b>${ticket.jumlah} orang</b>. Mohon datang bersama saat check-in.</p>
        `,
        attachments: [
          {
            filename: `ticket-${ticket._id}.png`,
            content: qrBuffer,                // buffer dari QRCode.toBuffer()
            cid: `qr-ticket-${ticket._id}`,   // harus sama dengan yang di src="cid:..."
          },
        ],
      });

    } catch (emailErr) {
      console.error("Gagal kirim email tiket:", emailErr);
      // tiket tetap dianggap berhasil, hanya emailnya yang gagal
    }

    // 5. Response ke frontend
    res.status(201).json({
      message: "Tiket berhasil dibeli dan QR code dikirim ke email",
      ticket,
    });
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
