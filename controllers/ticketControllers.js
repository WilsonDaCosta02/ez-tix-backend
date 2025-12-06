// controllers/ticketControllers.js
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "../assets/logo.png");
const logoBuffer = fs.readFileSync(logoPath);

// transporter email (sekali buat, dipakai semua request)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =====================
// BELI TIKET
// =====================
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

    // 🔹 Generate ID pembayaran sederhana
    const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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

      paymentStatus: "Berhasil", // project ini anggap langsung berhasil
      paymentId,
      paymentDate: new Date(),
    });
    await ticket.save();

    // 2. Generate QR untuk tiket ini (1 QR mewakili semua tiket di transaksi ini)
    const qrBuffer = await QRCode.toBuffer(`${ticket._id}`);

    // simpan base64 di DB (biar FE bisa pakai juga)
    ticket.qrCode = `data:image/png;base64,${qrBuffer.toString("base64")}`;
    await ticket.save();

    // 3. Kurangi kapasitas event
    event.kapasitas -= qty;
    await event.save();

    // 4. Kirim email e-ticket ke pembeli
    try {
      const tanggalEvent = new Date(event.tanggal);

      // tanggal saja, tanpa jam
      const tanggalIndonesia = tanggalEvent.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const infoJumlahOrang =
        ticket.jumlah > 1
          ? `QR ini berlaku untuk <b>${ticket.jumlah} orang</b>. Mohon datang bersama saat check-in.`
          : ``;

      await transporter.sendMail({
        from: `"Ez-Tix" <${process.env.EMAIL_USER}>`,
        to: ticket.emailPemesan,
        subject: `E-Ticket ${event.namaEvent}`,
        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            border: 1px solid #e0e0e0;
            padding: 20px;
            border-radius: 10px;
            background: #fafafa;
          ">

            <div style="text-align:center; margin-bottom:5px; margin-top:10px;">
              <img src="cid:logo-eztix"
                  alt="Ez-Tix Logo"
                  style="width:160px; height:auto;" />
            </div>

            <h2 style="text-align:center; color:#333; margin-top:5px; margin-bottom:20px;">
              Tiket Kamu Berhasil Dibeli!
            </h2>

            <p style="font-size:14px; color:#555;">
              Berikut detail pesananmu:
            </p>

            <div style="
              background:#fff;
              padding:15px;
              border-radius:8px;
              border:1px solid #ddd;
            ">
              <p><b>Nama Event:</b> ${event.namaEvent}</p>
              <p><b>Tanggal:</b> ${tanggalIndonesia}</p>
              <p><b>Waktu:</b> ${event.waktu}</p>
              <p><b>Lokasi:</b> ${event.lokasi}</p>
              <p><b>Nama Pemesan:</b> ${ticket.namaPemesan}</p>
              <p><b>Jumlah Tiket:</b> ${ticket.jumlah}</p>
              <p><b>Total Bayar:</b> Rp ${ticket.totalHarga.toLocaleString("id-ID")}</p>
              <p><b>Metode Pembayaran:</b> ${ticket.paymentMethod}</p>
              <p><b>ID Pembayaran:</b> ${ticket.paymentId}</p>
            </div>

            <h3 style="margin-top:25px; color:#333;">QR Code Check-in</h3>
            <p style="font-size:14px; color:#555;">Tunjukkan QR berikut saat check-in:</p>

            <div style="text-align:center; margin:20px 0;">
              <img src="cid:qr-ticket-${ticket._id}"
                  alt="QR Code Ticket"
                  style="width:200px; height:200px;" />
            </div>

            <p style="font-size:14px; color:#444;">
              <b>ID Tiket:</b> ${ticket._id} <br/>
              ${infoJumlahOrang}
            </p>

            <hr style="margin-top:30px;"/>
            <p style="font-size:12px; text-align:center; color:#888;">
              Email ini dikirim otomatis oleh sistem Ez-Tix. Jangan membalas email ini.
            </p>

          </div>
        `,
        attachments: [
          // QR Ticket
          {
            filename: `ticket-${ticket._id}.png`,
            content: qrBuffer,
            cid: `qr-ticket-${ticket._id}`,
          },
          // Logo Ez-Tix
          {
            filename: "logo-eztix.png",
            content: logoBuffer,
            cid: "logo-eztix",
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

// =====================
// LIHAT TIKET USER (Tiketku)
// =====================
// LIHAT TIKET USER (Tiketku)
const getMyTickets = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tickets = await Ticket.find({ user: req.user.id })
      .populate("event", "namaEvent tanggal waktu lokasi gambar hargaTiket")
      .lean();

    tickets = tickets.map((t) => {
      // -------- STATUS ACARA --------
      let statusAcara = "Acara Mendatang";

      if (t.event && t.event.tanggal) {
        const eventDate = new Date(t.event.tanggal);
        const eventDay = new Date(eventDate);
        eventDay.setHours(0, 0, 0, 0);

        if (eventDay.getTime() < today.getTime()) {
          statusAcara = "Berakhir";
        } else if (eventDay.getTime() === today.getTime()) {
          statusAcara = "Berlangsung";
        } else {
          statusAcara = "Acara Mendatang";
        }
      }

      // -------- FORMAT TANGGAL EVENT --------
      let tanggalEventFormatted = null;
      if (t.event && t.event.tanggal) {
        tanggalEventFormatted = new Date(t.event.tanggal).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      // -------- TANGGAL PEMBAYARAN --------
      const paymentDateSource = t.paymentDate || t.createdAt;
      let paymentDateFormatted = null;
      if (paymentDateSource) {
        paymentDateFormatted = new Date(paymentDateSource).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      // -------- STATUS PEMBAYARAN (DEFAULT: Berhasil) --------
      const paymentStatus = t.paymentStatus || "Berhasil";

      return {
        ...t,
        statusAcara,
        tanggalEventFormatted,
        paymentDateFormatted,
        paymentStatus,
        // biar jelas di FE:
        ticketId: t._id,
        paymentId: t.paymentId || null,
      };
    });

    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};


module.exports = { buyTicket, getMyTickets };
