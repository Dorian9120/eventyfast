const express = require("express");
const { User, ConnectionHistory } = require("../models");
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");
const { sendContactEmail } = require("../utils/mail");
const {
  sendConfirmationEmail,
  generateValidationCode,
  sendEmailWithCode,
} = require("../utils/mail");
const { validatePassword } = require("../controllers/userController");
const { isAdmin } = require("../controllers/userController");
const bcrypt = require("bcryptjs");
const router = express.Router();

router.get("/", isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error,
    });
  }
});

router.get(
  "/history/:userId",
  verifyToken,
  userController.getConnectionHistory
);
router.get("/:id(\\d+)/", isAdmin, userController.infoUser);
router.delete("/:id(\\d+)/", verifyToken, userController.deleteUser);
router.delete("/history/:userId", verifyToken, userController.deleteHistory);
router.put("/:id(\\d+)/password", verifyToken, userController.updatePassword);
router.put("/:id(\\d+)/username", verifyToken, userController.updateUsername);
router.put("/edit-user/:id", isAdmin, userController.updateUser);

router.post(
  "/:id(\\d+)/verify-password",
  verifyToken,
  userController.verifyPassword
);

router.post("/contact", async (req, res) => {
  const { username, email, subject, message } = req.body;

  if (!username || !email || !subject || !message) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const user = await User.findOne({ where: { username, email } });
    if (!user) {
      return res.status(400).json({
        message:
          "Aucun utilisateur trouvé avec cet username et cet email. Veuillez vérifier vos informations.",
      });
    }

    await sendContactEmail(email, username, subject, message);
    await sendConfirmationEmail(username, email, subject, message);

    return res.status(200).json({ message: "Message envoyé avec succès." });
  } catch (err) {
    return res.status(500).json({
      message: "Erreur serveur, message non envoyé.",
      error: err.message,
    });
  }
});

let resetCodes = {};

router.post("/reset-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email requis." });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé !" });
    }

    const resetCode = generateValidationCode();
    console.log(`Code généré pour ${email}: ${resetCode}`);

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);
    resetCodes[email] = { code: resetCode, expiration: expirationTime };

    await sendEmailWithCode(email, resetCode);

    return res.status(200).json({
      message: "Un code de réinitialisation a été envoyé à votre email.",
    });
  } catch (err) {
    console.error("Erreur lors de l'envoi du code : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/verify-password-code", async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const resetRecord = resetCodes[email];

    if (!resetRecord) {
      return res
        .status(400)
        .json({ message: "Aucun code trouvé pour cet email." });
    }

    if (resetRecord.code !== code) {
      console.log("Code du resetRecord:", resetRecord.code);
      console.log("Code reçu du frontend:", code);
      return res.status(400).json({ message: "Code invalide ou expiré." });
    }

    if (new Date() > new Date(resetRecord.expiration)) {
      delete resetCodes[email];
      return res.status(400).json({ message: "Le code a expiré." });
    }

    console.log(`Code généré pour ${email}:`, code);
    console.log(`Code stocké dans resetCodes:`, resetCodes[email]);

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { email } });

    delete resetCodes[email];

    return res
      .status(200)
      .json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    console.error("Erreur lors de la réinitialisation : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/history", verifyToken, async (req, res) => {
  const { userId, loginTime, ipAddress, device } = req.body;

  try {
    const newConnectionHistory = await ConnectionHistory.create({
      userId,
      loginTime,
      ipAddress,
      device,
    });
    res.status(201).json({
      message: "Historique de connexion ajouté",
      history: newConnectionHistory,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'historique:", error);
    res.status(500).json({ message: "Erreur lors de l'ajout de l'historique" });
  }
});

module.exports = router;
