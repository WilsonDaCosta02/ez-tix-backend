// controllers/userControllers.js
const User = require("../models/User");

// GET semua user biasa (tanpa admin)
const getAllUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const filter = {
      role: "user",                                  // ⬅️ cuma user, admin ke-skip
      $or: [
        { namaPengguna: { $regex: search, $options: "i" } },
        { email: { $regex: search,  $options: "i" } },
      ],
    };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("namaPengguna email createdAt")      // ⬅️ jangan kirim kataSandi
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// optional: HAPUS USER (buat tombol "Hapus" di UI)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin tidak boleh dihapus dari sini" });
    }

    await user.deleteOne();
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

module.exports = { getAllUsers, deleteUser };
