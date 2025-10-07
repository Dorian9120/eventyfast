const express = require("express");
const chatController = require("../controllers/chatController");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/ask", verifyToken, chatController.createMessage);
router.post("/reply/:questionId", verifyToken, chatController.replyToQuestion);

// récupérer toutes les questions et réponses d'un événement
router.get("/event/:eventId", verifyToken, chatController.getEventMessages);

// récupérer toutes les questions d'un user
router.get("/user/:userId", verifyToken, chatController.getUserChats);

module.exports = router;
