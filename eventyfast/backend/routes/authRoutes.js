const jwt = require("jsonwebtoken");
const express = require("express");
const { User, ConnectionHistory, Event, Notification } = require("../models");
const { sendEmail } = require("../utils/mail");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const router = express.Router();
const failedLoginAttempts = new Map();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email et mot de passe sont requis" });
  }

  if (failedLoginAttempts.has(email) && failedLoginAttempts.get(email) >= 3) {
    return res.status(429).json({
      message: "Trop de tentatives incorrectes. Réessayez dans 5 minutes.",
    });
  }
  console.log(failedLoginAttempts);

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log("❌ Utilisateur non trouvé:", email);
      return res.status(400).json({ message: "Email invalide." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Mot de passe incorrect pour:", email);
      failedLoginAttempts.set(email, (failedLoginAttempts.get(email) || 0) + 1);

      if (failedLoginAttempts.get(email) >= 3) {
        setTimeout(() => failedLoginAttempts.delete(email), 5 * 60 * 1000);
      }
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    failedLoginAttempts.delete(email);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    if (!user.id) {
      console.error("❌ L'id de l'utilisateur est invalide ou manquant");
      return res
        .status(400)
        .json({ message: "Erreur interne : ID utilisateur manquant" });
    }

    const userEvents = await Event.findAll();

    userEvents.map(async (event) => {
      if (event.participants >= event.nombreMaxParticipants) {
        const creatorId = event.userId;

        if (user.id !== creatorId) {
          return;
        }

        const existingNotification = await Notification.findOne({
          where: {
            userId: creatorId,
            eventId: event.id,
            type: "event_full",
          },
        });

        if (existingNotification) {
          return;
        }

        if (creatorId) {
          await Notification.create({
            userId: creatorId,
            eventId: event.id,
            message: `L'événement ${event.title} est complet.`,
            type: "event_full",
            read: false,
          });
        }
      }
    });

    const history = await ConnectionHistory.create({
      userId: user.id,
      loginTime: new Date(),
      ipAddress: req.ip,
      device: req.headers["user-agent"],
    });

    if (user && user.email) {
      console.log(`📧 Envoi de l'email à ${user.email}`);

      if (!user.username) {
        console.warn("⚠️ user.username est undefined !");
      }

      if (history) {
        let loginTime = history.loginTime;
        console.log(`🔔 Dernière connexion (brut) :`, loginTime);

        if (!(loginTime instanceof Date) || isNaN(loginTime.getTime())) {
          console.error("❌ loginTime est invalide :", loginTime);
          return res
            .status(500)
            .json({ message: "Erreur serveur", error: "LoginTime invalide" });
        }

        const formattedLoginTime = loginTime.toLocaleString("fr-FR", {
          timeZone: "Europe/Paris",
        });
        console.log(`🕒 loginTime après formatage :`, formattedLoginTime);

        await sendEmail(
          user.email,
          formattedLoginTime,
          user.username || "Utilisateur",
          req.ip,
          req.headers["user-agent"]
        );
      } else {
        console.log("⚠️ Aucune historique de connexion trouvé");
      }
    }

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 3 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Connexion réussie",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isTwoFactorVerified: user.isTwoFactorVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    });
  } catch (err) {
    console.error("❌ Erreur lors de la connexion : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

//Déconnexion
router.post("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });

  return res.status(200).json({ message: "Déconnexion réussie" });
});

// Endpoint pour activer la 2FA
router.post("/enable-2fa", async (req, res) => {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: "userId est requis" });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const secret = speakeasy.generateSecret({
      name: `EventyFast  (${user.email})`,
    });

    user.twoFactorSecret = secret.base32;
    user.isTwoFactorEnabled = true;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) {
        console.error("Erreur lors de la génération du QR code : ", err);
        return res
          .status(500)
          .json({ message: "Erreur lors de la génération du QR code" });
      }

      res.json({
        otpauth_url: secret.otpauth_url,
        qrCode: dataUrl,
      });
    });
  } catch (err) {
    console.error("Erreur lors de l'activation de la 2FA : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

// Endpoint pour vérifier un code 2FA
router.post("/verify-2fa", async (req, res) => {
  const { userId, token } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: "userId est requis" });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.isTwoFactorEnabled) {
      return res
        .status(400)
        .json({ message: "L'utilisateur n'a pas activé la 2FA" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });

    if (verified) {
      await user.update({ isTwoFactorVerified: true });

      return res.json({ success: true, message: "2FA vérifiée avec succès!" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Code incorrect!" });
    }
  } catch (err) {
    console.error("Erreur lors de la vérification du 2FA : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

// Route pour demander un code 2FA avant une action importante
router.post("/verify-2fa-action", async (req, res) => {
  const { userId, token } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId est requis" });
  }

  const user = await User.findByPk(userId);
  if (!user || !user.isTwoFactorEnabled) {
    return res
      .status(400)
      .json({ message: "L'utilisateur n'a pas activé la 2FA" });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
  });

  if (verified) {
    return res.status(200).json({
      message:
        "2FA vérifiée avec succès, vous pouvez changer votre mot de passe.",
    });
  } else {
    return res.status(400).json({ message: "Code incorrect !" });
  }
});

// Route pour désactiver la 2FA
router.post("/disable-2fa", async (req, res) => {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: "userId est requis" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    user.twoFactorSecret = null;
    user.isTwoFactorEnabled = false;
    user.isTwoFactorVerified = false;

    await user.save();

    return res.status(200).json({ message: "2FA désactivée avec succès" });
  } catch (err) {
    console.error("Erreur lors de la désactivation de la 2FA :", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;
