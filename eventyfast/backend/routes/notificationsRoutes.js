const express = require("express");
const chatController = require("../controllers/chatController");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/:userId", verifyToken, chatController.getUserNotifications);
router.put("/:notificationId/read", chatController.markNotificationAsRead);

module.exports = router;
