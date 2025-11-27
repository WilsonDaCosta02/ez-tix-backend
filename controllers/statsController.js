const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");

// ========================
// 🔶 1. SUMMARY DASHBOARD
// ========================
exports.getOverviewStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event tidak ditemukan" });

    // total customer (distinct email)
    const totalCustomer = await Ticket.distinct("emailPemesan", { event: eventId });

    // total tiket terjual & total pendapatan
    const ticketsData = await Ticket.aggregate([
      { $match: { event: event._id } },
      {
        $group: {
          _id: null,
          totalTiket: { $sum: "$jumlah" },
          totalPendapatan: { $sum: "$totalHarga" },
        },
      },
    ]);

    const totalTiketTerjual = ticketsData[0]?.totalTiket || 0;
    const totalPendapatan = ticketsData[0]?.totalPendapatan || 0;

    // kapasitasAwal = sisaTiket (di event.kapasitas) + yang sudah terjual
    const kapasitasAwal = event.kapasitas + totalTiketTerjual;
    const sisaTiket = event.kapasitas;

    const persenTerjual =
      kapasitasAwal > 0 ? (totalTiketTerjual / kapasitasAwal) * 100 : 0;

    return res.json({
      event,
      kapasitasAwal,
      sisaTiket,
      totalCustomer: totalCustomer.length,
      totalTiketTerjual,
      totalPendapatan,
      persenTerjual: Math.round(persenTerjual),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// =================================
// 🔶 2. DETAIL EVENT UNTUK KARTU
// =================================
exports.getEventStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event tidak ditemukan" });

    // total pesanan (jumlah transaksi)
    const totalPesanan = await Ticket.countDocuments({ event: eventId });

    // total pengunjung = total tiket terjual
    const pengunjungAgg = await Ticket.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: null, total: { $sum: "$jumlah" } } },
    ]);

    const totalPengunjung = pengunjungAgg[0]?.total || 0;

    return res.json({
      event,
      totalPesanan,
      totalPengunjung,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// ==================================
// 🔶 3. GRAPH — PENJUALAN PER HARI
// ==================================
exports.getChartStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const penjualanPerHari = await Ticket.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: "$jumlah" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json({
      data: penjualanPerHari.map((d) => ({
        date: d._id,
        jumlah: d.total,
      })),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// ========================
// 🔶 0. GLOBAL SUMMARY (SEMUA EVENT)
// ========================
exports.getGlobalStats = async (req, res) => {
  try {
    // 1. total customer unik di semua event
    const totalCustomer = await Ticket.distinct("emailPemesan");

    // 2. total tiket terjual & total pendapatan di semua event
    const globalAgg = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          totalTiketTerjual: { $sum: "$jumlah" },
          totalPendapatan: { $sum: "$totalHarga" },
        },
      },
    ]);

    const totalTiketTerjual = globalAgg[0]?.totalTiketTerjual || 0;
    const totalPendapatan = globalAgg[0]?.totalPendapatan || 0;

    // 3. hitung TOTAL KAPASITAS AWAL semua event
    //    kapasitasAwal = sisa (di db) + yang sudah terjual
    const events = await Event.find();

    // agregasi: berapa tiket terjual per event
    const soldPerEventAgg = await Ticket.aggregate([
      {
        $group: {
          _id: "$event",
          totalSold: { $sum: "$jumlah" },
        },
      },
    ]);

    const soldMap = {};
    soldPerEventAgg.forEach((row) => {
      soldMap[row._id.toString()] = row.totalSold;
    });

    let totalKapasitasAwal = 0;
    events.forEach((ev) => {
      const sold = soldMap[ev._id.toString()] || 0;
      totalKapasitasAwal += ev.kapasitas + sold;
    });

    // 4. response untuk header
    return res.json({
      totalCustomer: totalCustomer.length,
      totalTiket: totalKapasitasAwal,     // ini angka "Tiket" di header
      totalTiketTerjual,                  // kalau mau dipakai juga
      totalPendapatan,                    // "Jumlah tiket terjual Rp ...." di header
    });
  } catch (err) {
    console.error("Error getGlobalStats:", err);
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: err.message });
  }
};
