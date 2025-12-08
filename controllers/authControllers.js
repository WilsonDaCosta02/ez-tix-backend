const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// REGISTER USER (default role user)
const register = async (req, res) => {
  try {
    const { namaPengguna, email, kataSandi } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(kataSandi, 10);

    const newUser = new User({
      namaPengguna,
      email,
      kataSandi: hashedPassword,
      role: "user" // selalu user
    });

    await newUser.save();

    res.status(201).json({ message: "Registrasi user berhasil", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// REGISTER ADMIN (khusus, jangan tampilkan di UI publik)
const registerAdmin = async (req, res) => {
  try {
    const { namaPengguna, email, kataSandi } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(kataSandi, 10);

    const newAdmin = new User({
      namaPengguna,
      email,
      kataSandi: hashedPassword,
      role: "admin"
    });

    await newAdmin.save();

    res.status(201).json({ message: "Registrasi admin berhasil", user: newAdmin });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// LOGIN (tetap sama)
const login = async (req, res) => {
  try {
    const { email, kataSandi } = req.body;

    if (!email || !kataSandi) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email tidak ditemukan" });
    }

    const isPasswordValid = await bcrypt.compare(kataSandi, user.kataSandi);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Password salah" });
    }

    // generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: { id: user._id, namaPengguna: user.namaPengguna, email: user.email, role: user.role, profilePicture: user.profilePicture || null, }
    });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    console.log("Body request:", req.body); // Debug, cek data masuk

    const { email, kataSandiBaru, ulangiKataSandiBaru } = req.body;

    // 1. Validasi field kosong
    if (!email || !kataSandiBaru || !ulangiKataSandiBaru) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // 2. Validasi password baru harus sama
    if (kataSandiBaru !== ulangiKataSandiBaru) {
      return res.status(400).json({ message: "Kata sandi baru tidak sama" });
    }

    // 3. Cek apakah email ada di database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email tidak ditemukan" });
    }

    // 4. Hash password baru
    const hashedPassword = await bcrypt.hash(kataSandiBaru, 10);
    user.kataSandi = hashedPassword;
    await user.save();

    // 5. Response sukses
    return res.status(200).json({ message: "Password berhasil diubah" });

  } catch (err) {
    console.error("Error reset password:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

// GET PROFILE (protected)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-kataSandi");
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    res.json({ message: "Profil user", user });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err });
  }
};

// UPDATE PROFILE (protected, khusus USER)
const updateProfile = async (req, res) => {
  try {
    // admin tidak boleh update profil di sini
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Admin tidak bisa mengubah profil di endpoint ini" });
    }

    const { namaPengguna } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // update nama jika dikirim
    if (namaPengguna) {
      user.namaPengguna = namaPengguna;
    }

    // update foto kalau FE kirim file (pakai multer di route)
    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      message: "Profil berhasil diperbarui",
      user: {
        id: user._id,
        namaPengguna: user.namaPengguna,
        email: user.email,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: err.message });
  }
};

module.exports = { register, registerAdmin, login, resetPassword, getProfile, updateProfile };
