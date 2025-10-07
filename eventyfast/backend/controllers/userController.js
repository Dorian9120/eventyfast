const jwt = require("jsonwebtoken");
const { User, Event, ConnectionHistory } = require("../models");
const Sequelize = require("sequelize");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const {
  sendPasswordResetEmail,
  generateValidationCode,
  sendEmailWithCode,
} = require("../utils/mail");
const updateRequests = {};

const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      message: "Le mot de passe est requis",
    };
  }
  if (password.length < 6) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins 6 caractères",
    };
  }
  if (!/[A-Za-z]/.test(password)) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins une lettre",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Le mot de passe doit contenir au moins un chiffre",
    };
  }
  return { isValid: true };
};

const isAdmin = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(403).json({ message: "Accès interdit, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Accès réservé aux administrateurs" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

const infoUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    return res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    console.error("Erreur lors de la récupération de l'utilisateur :", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

//modifier un user depuis admin
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;

  const allowedFields = ["username", "role"];
  const invalidFields = Object.keys(req.body).filter(
    (key) => !allowedFields.includes(key)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: `Champs non valides détectés : ${invalidFields.join(", ")}`,
    });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const now = moment();
    const lastUpdateMoment = moment(user.lastUpdate);

    if (
      !lastUpdateMoment.isValid() ||
      now.diff(lastUpdateMoment, "hours") >= 1
    ) {
      user.updateCount = 0;
      user.lastUpdate = now.toISOString();
      await user.save();
    }

    if (user.updateCount >= 3) {
      return res.status(429).json({
        message: "Vous avez atteint la limite de 50 mises à jour par heure.",
      });
    }

    if (username) {
      if (
        typeof username !== "string" ||
        username.length < 3 ||
        username.length > 15
      ) {
        return res.status(400).json({
          message:
            "Le nom d'utilisateur doit contenir entre 3 et 15 caractères",
        });
      }

      const existingUserByUsername = await User.findOne({
        where: { username },
      });
      if (
        existingUserByUsername &&
        existingUserByUsername.id !== parseInt(id)
      ) {
        return res.status(400).json({ message: "Nom d'utilisateur déjà pris" });
      }

      user.username = username;
    }

    if (role) {
      const validRoles = ["admin", "user"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Rôle invalide" });
      }

      user.role = role;
    }

    user.updateCount += 1;
    user.lastUpdate = now.toISOString();
    await user.save();

    return res.status(200).json({
      message: "Utilisateur mis à jour avec succès",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'utilisateur : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  console.log("➡️ Requête DELETE reçue sur /api/users/:id");
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const events = await Event.findAll({ where: { userId: id } });

    if (events.length > 0) {
      await Event.destroy({ where: { userId: id } });
      console.log(
        `Tous les événements de l'utilisateur ${id} ont été supprimés.`
      );
    }

    const username = user.username;
    await user.destroy();

    return res
      .status(200)
      .json({ message: `${username} a été supprimé avec succès`, username });
  } catch (err) {
    console.error("Erreur lors de la suppression de l'utilisateur : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

// Changer son mot de passe
const updatePassword = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  const allowedFields = ["oldPassword", "newPassword"];
  const invalidFields = Object.keys(req.body).filter(
    (key) => !allowedFields.includes(key)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: `Champs non valides détectés : ${invalidFields.join(", ")}`,
    });
  }

  try {
    console.log("➡️ Requête reçue pour mettre à jour le mot de passe");
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const now = moment();
    const lastUpdateMoment = moment(user.lastUpdate);

    if (
      !lastUpdateMoment.isValid() ||
      now.diff(lastUpdateMoment, "hours") >= 1
    ) {
      user.updateCount = 0;
      user.lastUpdate = now.toISOString();
      await user.save();
    }

    if (user.updateCount >= 3) {
      console.log(`⚠️ Limite atteinte : ${user.updateCount} mises à jour`);
      return res.status(429).json({
        message: "Vous avez atteint la limite de 3 mises à jour par heure.",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Ancien mot de passe incorrect" });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // user.username = username;
    user.updateCount += 1;
    user.lastUpdate = new Date();
    user.lastUpdate = now.toISOString();
    await sendPasswordResetEmail(user.email, user.username, new Date());
    await user.save();
    console.log("Mot de passe mis à jour pour l'utilisateur :", user.email);
    console.log(
      "Nombre de mises à jour dans la dernière heure :",
      user.updateCount
    );

    return res
      .status(200)
      .json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

// changer uniquement le nom d'utilisateur
const updateUsername = async (req, res) => {
  console.log("Fonction updateUsername appelée");
  const { id } = req.params;
  const { username } = req.body;

  const allowedFields = ["username"];
  const invalidFields = Object.keys(req.body).filter(
    (key) => !allowedFields.includes(key)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: `Champs non valides détectés : ${invalidFields.join(", ")}`,
    });
  }

  if (
    username &&
    (typeof username !== "string" ||
      username.length < 3 ||
      username.length > 15)
  ) {
    return res.status(400).json({
      message: "Le nom d'utilisateur doit contenir entre 3 et 15 caractères",
    });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const now = moment();
    const lastUpdateMoment = moment(user.lastUpdate);

    if (
      !lastUpdateMoment.isValid() ||
      now.diff(lastUpdateMoment, "hours") >= 1
    ) {
      user.updateCount = 0;
      user.lastUpdate = now.toISOString();
      await user.save();
    }

    if (user.updateCount >= 3) {
      console.log(`⚠️ Limite atteinte : ${user.updateCount} mises à jour`);
      return res.status(429).json({
        message: "Vous avez atteint la limite de 3 mises à jour par heure.",
      });
    }

    if (!username) {
      return res.status(400).json({
        message:
          "Le nom d'utilisateur est requis pour pouvoir le mettre à jour !",
      });
    }

    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername && existingUserByUsername.id !== parseInt(id)) {
      return res.status(400).json({ message: "Nom d'utilisateur déjà pris" });
    }

    user.username = username;
    user.updateCount += 1;
    user.lastUpdate = new Date();
    user.lastUpdate = now.toISOString();
    await user.save();

    return res.status(200).json({
      message: "Nom d'utilisateur mis à jour avec succès",
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du nom d'utilisateur : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

const getConnectionHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const history = await ConnectionHistory.findAll({
      where: { userId },
      order: [["loginTime", "DESC"]],
    });

    const user = await User.findOne({ where: { id: userId } });

    return res.status(200).json({ history });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

const deleteHistory = async (req, res) => {
  const userId = req.params.userId;
  const tokenUserId = req.user.id;

  if (userId !== tokenUserId.toString()) {
    return res.status(403).json({
      message: "Vous n'êtes pas autorisé à supprimer cet historique.",
    });
  }

  try {
    const result = await ConnectionHistory.destroy({ where: { userId } });

    if (result === 0) {
      return res
        .status(404)
        .json({ message: "Aucune connexion trouvée pour cet utilisateur." });
    }

    return res.status(200).json({ message: "Historique supprimé avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression de l'historique : ", err);
    return res.status(500).json({
      message: "Erreur serveur lors de la suppression de l'historique.",
    });
  }
};

const verifyPassword = async (req, res) => {
  const { oldPassword } = req.body;
  const { id } = req.user;

  const allowedFields = ["oldPassword"];
  const invalidFields = Object.keys(req.body).filter(
    (key) => !allowedFields.includes(key)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: `Champs non valides détectés : ${invalidFields.join(", ")}`,
    });
  }

  if (!oldPassword) {
    return {
      isValid: false,
      message: "L'ancien mot de passe est requis pour modifier le mot de passe",
    };
  }

  try {
    const user = await User.findByPk(id);

    if (!user) {
      console.log("Utilisateur non trouvé avec l'ID: ", id);
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (!user.password) {
      console.log(
        "Le mot de passe de l'utilisateur est inexistant ou undefined."
      );
      return res
        .status(500)
        .json({ message: "Mot de passe de l'utilisateur introuvable." });
    }

    console.log("Mot de passe haché de l'utilisateur:", user.password);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      console.log("Le mot de passe ne correspond pas.");
      return res.status(400).json({
        valid: false,
        message: "L'ancien mot de passe est incorrect.",
      });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error("Erreur de vérification du mot de passe:", err);
    return res.status(500).json({
      message: "Erreur de vérification du mot de passe.",
      error: err.message,
    });
  }
};

module.exports = {
  updatePassword,
  deleteUser,
  updateUsername,
  validatePassword,
  getConnectionHistory,
  deleteHistory,
  verifyPassword,
  isAdmin,
  updateUser,
  infoUser,
};
