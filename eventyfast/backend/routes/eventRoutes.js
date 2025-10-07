const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  Event,
  User,
  EventParticipants,
  Favorite,
  Category,
} = require("../models");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  sendParticipationEmail,
  sendDeleteParticipationEmail,
} = require("../utils/mail");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const axios = require("axios");
const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      hours,
      location,
      userId,
      nombreMaxParticipants,
      organizers,
      categoryId,
    } = req.body;
    console.log("Request body:", req.body);

    if (
      !title ||
      !description ||
      !hours ||
      !date ||
      !location ||
      !userId ||
      !nombreMaxParticipants ||
      !organizers ||
      !categoryId
    ) {
      return res.status(400).json({
        message: "Tous les champs obligatoires doivent être remplis.",
      });
    }

    const dateParts = date.split("/");

    if (dateParts.length !== 3) {
      return res.status(400).json({
        message:
          "Le format de la date est invalide. Utilisez le format jj/mm/aaaa.",
      });
    }

    const [day, month, year] = dateParts;

    const formattedMonth = month.padStart(2, "0");
    const formattedDay = day.padStart(2, "0");

    const formattedHours = hours || "00:00";
    const fullDateString = `${year}-${formattedMonth}-${formattedDay}T${formattedHours}:00`;

    console.log("Full Date String:", fullDateString);

    const eventDate = new Date(fullDateString);
    const currentDate = new Date();

    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({
        message: "La date et l'heure de l'événement sont invalides.",
      });
    }

    if (eventDate.getTime() <= currentDate.getTime()) {
      return res.status(400).json({
        message:
          "La date et l'heure de l'événement ne peuvent pas être dans le passé.",
      });
    }

    const formattedDateForDB = `${year}-${formattedMonth}-${formattedDay}`;

    console.log("Formatted Date for DB:", formattedDateForDB);

    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "L'utilisateur avec cet ID n'existe pas." });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ message: "La catégorie spécifiée n'existe pas." });
    }

    const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${googleMapsApiKey}`;
    const googleMapsResponse = await axios.get(googleMapsUrl);

    const { lat, lng } = googleMapsResponse.data.results[0].geometry.location;
    if (!lat || !lng) {
      return res.status(400).json({
        message: "Les coordonnées géographiques sont manquantes.",
      });
    }

    const addressComponents =
      googleMapsResponse.data.results[0].address_components;
    let region = "";
    let department = "";

    addressComponents.forEach((component) => {
      if (component.types.includes("administrative_area_level_1")) {
        region = component.long_name;
      }
      if (component.types.includes("administrative_area_level_2")) {
        department = component.long_name;
      }
    });

    if (!region || !department) {
      return res.status(400).json({
        message:
          "Impossible de récupérer la région ou le département à partir de l'adresse.",
      });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const event = await Event.create({
      title,
      description,
      date: formattedDateForDB,
      hours: formattedHours,
      location,
      userId,
      nombreMaxParticipants,
      organizers,
      categoryId: category.id,
      latitude: lat,
      longitude: lng,
      region: region,
      department: department,
      image: req.file ? req.file.path : null,
    });

    const eventCreationDate = event.createdAt;
    console.log("Événement créé le :", eventCreationDate);

    res.status(201).json({
      message: "Événement créé avec succès",
      event,
      googleMapsApiKey,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l’événement:", error);
    res.status(400).json({
      message: "Erreur lors de la création de l’événement",
      error: error.message,
    });
  }
});

// Route pour uploader l'image d'un événement spécifique
router.post(
  "/:eventId/upload-image",
  upload.single("image"),
  async (req, res) => {
    const { eventId } = req.params;
    if (!req.file) {
      return res.status(400).send({ message: "Aucune image téléchargée." });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    try {
      const updatedEvent = await Event.update(
        { image: imageUrl },
        { where: { id: eventId } }
      );

      if (updatedEvent[0] === 0) {
        return res.status(404).send({ message: "Événement non trouvé." });
      }

      res.json({ message: "Image upload avec succès", imageUrl });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ message: "Erreur lors de l'enregistrement de l'image." });
    }
  }
);

//suprimmer l'image d'un event
router.delete("/:eventId/delete-image", async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findOne({ where: { id: eventId } });

    if (!event) {
      return res.status(404).send({ message: "Événement non trouvé." });
    }

    if (!event.image) {
      return res.status(400).send({ message: "Aucune image à supprimer." });
    }

    const imagePath = path.join(
      __dirname,
      "..",
      "uploads",
      event.image.split("/uploads/")[1]
    );

    fs.unlink(imagePath, async (err) => {
      if (err) {
        return res
          .status(500)
          .send({ message: "Erreur lors de la suppression de l'image." });
      }

      await Event.update({ image: null }, { where: { id: eventId } });

      res.json({ message: "Image supprimée avec succès" });
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Erreur lors de la suppression de l'image." });
  }
});

//récuperer les events
router.get("/", async (req, res) => {
  const userId = req.query.userId;

  try {
    const events = await Event.findAll();

    let userFavorites = [];

    if (userId) {
      userFavorites = await Favorite.findAll({
        where: { userId },
        attributes: ["eventId"],
      });
    }

    const favoriteEventIds = userFavorites.map((fav) => fav.eventId);

    const updatedEvents = events.map((event) => {
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toISOString().split("T")[0];
      const formattedHours = event.hours || "00:00";

      return {
        ...event.toJSON(),
        date: formattedDate,
        hours: formattedHours,
        isFavorite: favoriteEventIds.includes(event.id),
      };
    });

    res.status(200).json(updatedEvents);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des événements",
      error,
    });
  }
});

// Route pour récupérer les événements d'un utilisateur spécifique
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId est requis." });
    }

    const userEvents = await Event.findAll({ where: { userId } });

    if (!userEvents.length) {
      return res.status(404).json({ message: "Aucun événement trouvé." });
    }
    userEvents.map(async (event) => {
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toISOString().split("T")[0];
      const formattedHours = event.hours || "00:00";

      return {
        ...event.toJSON(),
        date: formattedDate,
        hours: formattedHours,
      };
    });

    console.log("Événements trouvés :", userEvents);
    res.status(200).json(userEvents);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements :", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des événements.",
      error,
    });
  }
});

router.get("/key", (req, res) => {
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    return res.status(500).json({ message: "Clé API Google Maps manquante" });
  }

  res.json({ googleMapsApiKey });
});

// Route pour récupérer les détails d'un événement spécifique
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    const participants = await EventParticipants.findAll({
      where: { eventId: eventId },
    });

    res.status(200).json({ event, participants });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détails de l’événement:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des détails de l’événement.",
    });
  }
});

// Route pour ajouter un participant à un événement
router.post("/:eventId/participant", verifyToken, async (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.body.userId;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ message: "L'utilisateur n'existe pas." });
    }

    const event = await Event.findByPk(eventId);

    if (!userId) {
      return res
        .status(400)
        .json({ message: "L'identifiant de l'utilisateur est requis." });
    }

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    if (String(event.userId) === String(userId)) {
      return res.status(400).json({
        message:
          "Vous ne pouvez pas participer à l'événement que vous avez créé.",
      });
    }

    if (
      event.nombreMaxParticipants &&
      event.participants >= event.nombreMaxParticipants
    ) {
      return res
        .status(400)
        .json({ message: "Le nombre maximal de participants a été atteint." });
    }

    const existingParticipant = await EventParticipants.findOne({
      where: { eventId: eventId, userId: userId },
    });

    if (existingParticipant) {
      return res
        .status(400)
        .json({ message: "Vous êtes déjà inscrit à cet événement." });
    }

    const ticketCode = `EVT-${crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase()}`;

    await EventParticipants.create({
      eventId: eventId,
      userId: userId,
      ticketCode: ticketCode,
    });

    await Event.increment("participants", { by: 1, where: { id: eventId } });
    const updatedEvent = await Event.findByPk(eventId);

    await sendParticipationEmail(user.username, user.email, event, ticketCode);

    res.status(200).json({
      message: "Vous êtes inscrit à l'événement avec succès.",
      ticketCode: ticketCode,
      participants: updatedEvent.participants,
    });
  } catch (err) {
    console.error("Erreur lors de la participation :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

//récuperer les participants d'un event
router.get("/:eventId/participant", verifyToken, async (req, res) => {
  const eventId = req.params.eventId;

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    const participants = await EventParticipants.findAll({
      where: { eventId: eventId },
      include: [
        {
          model: User,
          attributes: ["username", "email", "phone"],
        },
        {
          model: Event,
          attributes: ["title"],
        },
      ],
    });

    if (participants.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun participant trouvé pour cet événement." });
    }

    res.status(200).json({ participants });
  } catch (err) {
    console.error("Erreur lors de la récupération des participants :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

//supprimer un participant
router.delete("/:eventId/participant/:userId", async (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.params.userId;

  try {
    const event = await Event.findByPk(eventId);
    const user = await User.findByPk(userId);

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    const participant = await EventParticipants.findOne({
      where: { eventId: eventId, userId: userId },
    });

    if (!participant) {
      return res.status(404).json({ message: "Participant non trouvé." });
    }

    await participant.destroy();

    if (event.participants > 0) {
      event.participants -= 1;
      await event.save();
    }

    await sendDeleteParticipationEmail(user.username, user.email, event);

    res.status(200).json({
      message: "Participant supprimé de l'événement avec succès.",
      participants: event.participants,
    });
  } catch (err) {
    console.error("Erreur lors de la suppression du participant :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// Route pour modifier un événement
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    date,
    hours,
    location,
    organizers,
    nombreMaxParticipants,
  } = req.body;

  try {
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    if (String(event.userId) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Vous n'êtes pas autorisé à modifier cet événement" });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.hours = hours || event.hours;
    event.location = location || event.location;
    event.organizers = organizers || event.organizers;
    event.nombreMaxParticipants =
      nombreMaxParticipants || event.nombreMaxParticipants;

    await event.save();

    return res.status(200).json({ event });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'événement:", error);
    res.status(500).json({
      message: "Impossible de modifier l'événement. Veuillez réessayer.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    await event.destroy();

    res.status(200).json({ message: "Événement supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l’événement:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression de l’événement." });
  }
});

//Récuperer les participations d'un user
router.get("/participation/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const participations = await EventParticipants.findAll({
      where: { userId: userId },
      include: {
        model: Event,
        attributes: [
          "id",
          "title",
          "description",
          "date",
          "hours",
          "location",
          "organizers",
        ],
      },
    });

    if (participations.length === 0) {
      return res.status(404).json({
        message: "Aucune participation trouvée pour cet utilisateur.",
      });
    }

    const events = participations.map((participation) => participation.Event);

    return res.status(200).json(events);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
