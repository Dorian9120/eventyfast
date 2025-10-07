const express = require("express");
const { User } = require("../models");
const bcrypt = require("bcryptjs");
const {
  validateEmail,
  validatePassword,
} = require("../controllers/registerController");
const { generateValidationCode, sendEmailWithCode } = require("../utils/mail");
const { registerLimiter } = require("../middleware/limiter");

const router = express.Router();

let validationCodes = {};

router.post("/", registerLimiter, async (req, res) => {
  console.log("➡️ Requête POST reçue sur /api/register");

  const { username, email, password, confirmPassword, phone, dateOfBirth } =
    req.body;

  if (
    !email ||
    !password ||
    !confirmPassword ||
    !username ||
    !phone ||
    !dateOfBirth
  ) {
    return res
      .status(400)
      .json({ message: "Tout les champs ne sont pas présent." });
  }

  try {
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

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "L'email n'est pas valide" });
    }

    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Nom d'utilisateur déjà pris" });
    }

    const existingPhoneByPhone = await User.findOne({ where: { phone } });
    if (existingPhoneByPhone) {
      return res
        .status(400)
        .json({ message: "Numéro de téléphone déjà pris." });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Les mots de passes ne correspondent pas." });
    }

    if (!/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({
        message: "Le numéro de téléphone doit contenir entre 10 et 15 chiffres",
      });
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    const hasBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    const userAge = hasBirthdayPassed ? age : age - 1;

    if (userAge < 16) {
      return res.status(400).json({
        message: "Vous devez avoir au moins 16 ans pour créer un compte.",
      });
    }

    const validationCode = generateValidationCode();

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);
    validationCodes[email] = {
      code: validationCode,
      expiration: expirationTime,
    };

    await sendEmailWithCode(email, validationCode);

    return res.status(200).json({
      message:
        "Un code de validation a été envoyé à votre email. Veuillez le saisir pour finaliser l'inscription.",
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

// Route pour vérifier le code de validation
router.post("/verify-code", async (req, res) => {
  const { username, phone, dateOfBirth, email, password, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email et code sont requis" });
  }

  try {
    const validationRecord = validationCodes[email];

    if (!validationRecord) {
      return res
        .status(400)
        .json({ message: "Aucun code trouvé pour cet email." });
    }

    if (validationRecord.code !== code) {
      console.log("Code invalide");
      return res.status(400).json({ message: "Code invalide" });
    }

    if (
      !validationRecord.expiration ||
      isNaN(new Date(validationRecord.expiration).getTime())
    ) {
      return res
        .status(400)
        .json({ message: "Le code est expiré ou l'expiration est invalide." });
    }

    if (new Date() > new Date(validationRecord.expiration)) {
      delete validationCodes[email];
      console.log("Le code a expiré");
      return res.status(400).json({ message: "Le code a expiré" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      dateOfBirth,
    });

    delete validationCodes[email];
    console.log("Nouvel utilisateur créé:", newUser);

    return res
      .status(200)
      .json({ message: "Inscription réussie", user: newUser });
  } catch (err) {
    console.error("Erreur lors de la vérification du code : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;
