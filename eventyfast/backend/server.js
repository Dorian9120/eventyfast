require("dotenv").config({ path: "../.env" });
const express = require("express");
const jwtSecret = process.env.JWT_SECRET;
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sequelize = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const register = require("./routes/registerRoutes");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userProfileRoutes = require("./routes/userProfile");
const favoriteRoutes = require("./routes/favoritesRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const googleRoutes = require("./routes/googleRoutes");

const corsOptions = {
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use("/api/chat", chatRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/register", register);
app.use("/api", authRoutes);
app.use("/api/users", userProfileRoutes);
app.use(express.urlencoded({ extended: true }));

app.use("/api", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api", googleRoutes);
app.use("/uploads", express.static("uploads"));

sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ Connexion à la base de données réussie"))
  .catch((err) => {
    console.error("❌ Erreur de connexion à la base de données:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
