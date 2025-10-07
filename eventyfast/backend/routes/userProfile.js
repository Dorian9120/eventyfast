const express = require("express");
const { User } = require("../models");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/profile", verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "Utilisateur non authentifié" });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isTwoFactorVerified: user.isTwoFactorVerified,
      twoFactorSecret: user.twoFactorSecret,
    });
  } catch (err) {
    console.error("Erreur lors de la récupération du profil :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
