const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    namaPengguna: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    kataSandi: { type: String, required: true },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // hanya dipakai di profil user (admin boleh kosong/null)
    profilePicture: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
