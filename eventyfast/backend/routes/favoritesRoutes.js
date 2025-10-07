const express = require("express");
const router = express.Router();
const { User, Event, Favorite } = require("../models");

router.post("/add", async (req, res) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({
      message: "L'ID de l'utilisateur et l'ID de l'événement sont requis",
    });
  }

  try {
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "L'utilisateur avec cet ID n'existe pas." });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    if (String(event.userId) === String(userId)) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez pas liker votre propre annonce." });
    }

    const favoriteExists = await Favorite.findOne({
      where: { userId, eventId },
    });

    if (favoriteExists) {
      return res
        .status(400)
        .json({ message: "Cet événement est déjà dans vos favoris." });
    }

    const favorite = await Favorite.create({
      userId: userId,
      eventId: eventId,
    });

    return res.status(201).json({ message: "Ajouté aux favoris", favorite });
  } catch (err) {
    console.error("Erreur lors de l'ajout au favoris : ", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
});

router.delete("/delete", async (req, res) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({
      message: "L'ID de l'utilisateur et l'ID de l'événement sont requis",
    });
  }

  try {
    const favorite = await Favorite.findOne({ where: { userId, eventId } });
    if (!favorite) {
      return res.status(404).json({ message: "Le favori n'existe pas" });
    }

    await Favorite.destroy({ where: { userId, eventId } });
    res
      .status(200)
      .json({ message: "Evenement supprimé des favoris avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

//récuperer les favoris d'un user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const favorites = await Favorite.findAll({
      where: { userId },
      include: [
        {
          model: Event,
          attributes: [
            "id",
            "title",
            "description",
            "date",
            "hours",
            "location",
            "participants",
            "nombreMaxParticipants",
            "organizers",
            "image",
          ],
        },
      ],
    });

    if (!favorites || favorites.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun favori trouvé pour cet utilisateur" });
    }

    const formattedFavorites = favorites.map((fav) => ({
      id: fav.id,
      eventId: fav.eventId,
      title: fav.Event.title,
      description: fav.Event.description,
      date: fav.Event.date,
      hours: fav.Event.hours,
      location: fav.Event.location,
      participants: fav.Event.participants,
      nombreMaxParticipants: fav.Event.nombreMaxParticipants,
      organizers: fav.Event.organizers,
      image: fav.Event.image,
    }));

    res.status(200).json(formattedFavorites);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;
