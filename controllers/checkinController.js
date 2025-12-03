// controllers/checkinController.js
const Ticket = require("../models/Ticket");

// ============================
// 1. SCAN & CHECK-IN GLOBAL
// ============================
exports.scanTicket = async (req, res) => {
  try {
    const { ticketId } = req.body; // hasil decode QR = _id Ticket

    if (!ticketId) {
      return res.status(400).json({ message: "ticketId wajib dikirim" });
    }

    // cari tiket + event-nya
    const ticket = await Ticket.findById(ticketId).populate(
      "event",
      "namaEvent tanggal waktu lokasi"
    );

    if (!ticket) {
      return res
        .status(404)
        .json({ message: "Tiket tidak ditemukan atau QR tidak valid" });
    }

    // sudah pernah dipakai?
    if (ticket.isCheckedIn) {
      return res.status(400).json({
        message: "Tiket sudah pernah digunakan untuk check-in",
        status: "SUDAH_CHECKIN",
        data: {
          ticketId: ticket._id,
          email: ticket.emailPemesan,
          jumlah: ticket.jumlah,
          event: ticket.event,
          checkInTime: ticket.checkInTime,
        },
      });
    }

    // tandai sebagai check-in
    ticket.isCheckedIn = true;
    ticket.checkInTime = new Date();
    ticket.checkInBy = req.user.id; // admin yg sedang login
    await ticket.save();

    return res.json({
      message: "Check-in berhasil",
      status: "CHECKIN_BERHASIL",
      data: {
        ticketId: ticket._id,
        email: ticket.emailPemesan,
        jumlah: ticket.jumlah,
        event: ticket.event, // di sini sudah ada nama event dll
        checkInTime: ticket.checkInTime,
      },
    });
  } catch (err) {
    console.error("Error scanTicket:", err);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// ====================================
// 2. LIST HASIL CHECK-IN PER EVENT
// ====================================
exports.getCheckinListByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {
      event: eventId,
      isCheckedIn: true,
    };

    // opsional: pencarian di kolom email / id tiket
    if (search) {
      query.$or = [
        { emailPemesan: { $regex: search, $options: "i" } },
        { _id: search }, // kalau admin ketik kode tiket langsung
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Ticket.find(query)
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("_id emailPemesan jumlah checkInTime"),
      Ticket.countDocuments(query),
    ]);

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      data: items.map((t) => ({
        ticketId: t._id,
        email: t.emailPemesan,
        jumlah: t.jumlah,
        checkInTime: t.checkInTime,
        status: "Check-in Berhasil",
      })),
    });
  } catch (err) {
    console.error("Error getCheckinListByEvent:", err);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: err.message });
  }
};
