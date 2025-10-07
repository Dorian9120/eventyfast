const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const { User, ConnectionHistory, Notification, Event } = require("../models");
const client = new OAuth2Client(process.env.ID_CLIENT_GOOGLE);
const { generateToken } = require("../middleware/authMiddleware");
const { sendEmail } = require("../utils/mail");

router.get("/google-clientid", (req, res) => {
  const googleClientId = process.env.ID_CLIENT_GOOGLE;

  if (!googleClientId) {
    return res.status(400).json({ error: "ID client Google invalide" });
  }

  res.json({ googleClientId });
});

router.post("/validate-google-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token manquant" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.ID_CLIENT_GOOGLE,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email non trouvé dans le payload" });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Email non trouvé, veuillez vous inscrire" });
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

    if (history) {
      let loginTime = history.loginTime;
      console.log(`🔔 Dernière connexion (brut) :`, loginTime);

      if (!(loginTime instanceof Date) || isNaN(loginTime.getTime())) {
        console.error("❌ loginTime est invalide:", loginTime);
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

    const jwtToken = generateToken(user);
    res.cookie("authToken", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 3 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Connexion réussie",
      user: {
        email: user.email,
        username: user.username,
        id: user.id,
        role: user.role,
        isTwoFactorVerified: user.isTwoFactorVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la validation du token", error);
    res.status(500).json({ message: "Erreur lors de la validation du token" });
  }
});

module.exports = router;
