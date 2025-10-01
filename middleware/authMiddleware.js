const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Akses ditolak, token tidak ada" });
  }

  const token = authHeader.split(" ")[1]; // format: Bearer <token>
  if (!token) {
    return res.status(401).json({ message: "Token tidak valid" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // simpan data user ke req
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token tidak sah atau sudah kadaluarsa" });
  }
};

module.exports = authMiddleware;
