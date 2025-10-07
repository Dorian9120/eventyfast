const { Message, Event, User, Notification } = require("../models");

//  Poser une question
const createMessage = async (req, res) => {
  try {
    const { content, eventId } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "Utilisateur non connecté !" });
    }

    if (!content || !eventId) {
      return res
        .status(400)
        .json({ message: "Le contenu et l'eventId sont requis." });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement introuvable." });
    }

    const receiverId = event.userId;
    if (receiverId !== userId) {
      await Notification.create({
        userId: receiverId,
        type: "chat",
        message: `Vous avez reçu une question pour l'événement "${event.title}"`,
      });
    }
    console.log(`Receiver ID: ${receiverId}, User ID: ${userId}`);

    const message = await Message.create({ content, userId, eventId });
    res
      .status(201)
      .json({ message: "Question envoyée avec succès.", data: message });

    console.log(`Notification créée: ${JSON.stringify(message)}`);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur : " + error.message });
  }
};

// Récupérer les questions et réponses d'un événement
const getEventMessages = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement introuvable." });
    }

    const messages = await Message.findAll({
      where: { eventId, questionId: null },
      include: [
        { model: User, as: "User", attributes: ["id", "username"] },
        {
          model: Message,
          as: "response",
          include: [
            { model: User, as: "User", attributes: ["id", "username"] },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur : " + error.message });
  }
};

// Répondre à une question
const replyToQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res
        .status(400)
        .json({ message: "Le contenu de la réponse est requis." });
    }

    const question = await Message.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question introuvable." });
    }

    const event = await Event.findByPk(question.eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement introuvable." });
    }

    const reply = await Message.create({
      content,
      userId,
      eventId: question.eventId,
      questionId,
    });

    const replyWithUser = await Message.findByPk(reply.id, {
      include: [{ model: User, as: "User", attributes: ["username"] }],
    });

    await Notification.create({
      userId: question.userId,
      type: "chat",
      message: `Votre question a reçu une réponse.`,
    });

    res.status(201).json({
      message: "Réponse envoyée avec succès.",
      data: replyWithUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur : " + error.message });
  }
};

const getUserChats = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["username"],
        },
        {
          model: Message,
          as: "response",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["username"],
            },
          ],
        },
        { model: Event, as: "Event", attributes: ["title"] },
      ],
      order: [["createdAt", "ASC"]],
    });

    if (!userId) {
      return res.status(400).json({ message: "Utilisateur non connecté !" });
    }

    if (messages.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun chat trouvé pour cet utilisateur." });
    }

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des chats de l'utilisateur.",
    });
  }
};

//get les notifs d'un user
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.findAll({
      where: { userId, isRead: false },
      order: [["createdAt", "DESC"]],
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur : " + error.message });
  }
};

//marque lu pour les notifs
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification introuvable." });
    }

    await Notification.update(
      { isRead: true },
      { where: { id: notificationId } }
    );

    await Notification.destroy({
      where: { id: notificationId },
    });

    res.json({ message: "Notification marquée comme lue." });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur : " + error.message });
  }
};

module.exports = {
  createMessage,
  getEventMessages,
  replyToQuestion,
  getUserChats,
  getUserNotifications,
  markNotificationAsRead,
};
