import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Home.css";
import { FaArrowRightLong } from "react-icons/fa6";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const storedUsername = localStorage.getItem("username");
  const [languageChanged, setLanguageChanged] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    console.log("Langue actuelle:", i18n.language);
    setLanguageChanged((prev) => !prev);
  }, [i18n.language]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (
        storedUsername &&
        storedUsername !== "undefined" &&
        storedUsername !== null
      ) {
        setIsLoggedIn(true);
        setUsername(storedUsername);
        console.log("username :", storedUsername);
        console.log("role :", role);
      } else {
        handleLogout();
      }
    };

    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);

    if (isLoggedIn) {
      const userId = localStorage.getItem("userId");

      const fetchNotificationsWithAuth = async () => {
        try {
          await fetchNotifications(userId);
        } catch (error) {
          if (error.response && error.response.status === 401) {
            handleLogout();
          }
        }
      };

      fetchNotificationsWithAuth();
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    console.log("Logout HomePage...");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUsername("");
    navigate("/");
    setMessage("Votre session a expiré. Veuillez vous reconnecter.");
  };

  const fetchNotifications = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/notifications/${userId}`,
        {
          withCredentials: true,
        }
      );

      const unreadNotifications = response.data.filter(
        (notif) => !notif.isRead
      );
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await axios.put(
        `http://localhost:3000/api/notifications/${notificationId}/read`
      );
      navigate("/notifs");
    } catch (error) {
      console.error("Erreur lors de la gestion de la notification:", error);
    }
  };

  return (
    <div className="home-container">
      <div className={`home-content ${isLoggedIn ? "logged-in" : ""}`}>
        {isLoggedIn ? (
          <>
            <h1>
              {t("Bonjour")}, {username} ! 🎉
            </h1>
            <div className="separator"></div>
            <p>
              {t(
                "Ravi de vous revoir ! Continuez à explorer les événements et à découvrir de nouvelles opportunités."
              )}
            </p>
            <p>
              {t(
                "Que vous souhaitiez organiser un événement inoubliable ou trouver une sortie qui vous correspond, vous êtes au bon endroit."
              )}
            </p>
            <p>
              {t(
                "Ne manquez rien des dernières annonces et rejoignez les événements qui vous intéressent dès maintenant !"
              )}
            </p>
            <div className="home-buttons">
              <Link
                to="/my-ads"
                className="auth-button"
                style={{ background: "#2c3e50" }}
              >
                {t("Créer un Événement")}
              </Link>
              <Link to="/events" className="consult-home">
                {t("Consultez nos Annonces")}
                <FaArrowRightLong className="arrow-icon" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1>
              {t("Bienvenue sur")} <span>{t("EventyFast")}</span>
            </h1>
            <div className="separator"></div>
            <p>
              {t(
                "EventyFast est une plateforme innovante qui permet de créer, gérer et participer à des événements en toute simplicité."
              )}
            </p>

            <div className="home-features">
              <div className="feature">
                <i className="fas fa-calendar-check"></i>
                <h3>{t("Création d'événements")}</h3>
                <p>
                  {t(
                    "Créez facilement vos propres événements et partagez-les avec la communauté."
                  )}
                </p>
              </div>

              <div className="feature">
                <i className="fas fa-users"></i>
                <h3>{t("Participation simplifiée")}</h3>
                <p>
                  {t(
                    "Rejoignez des événements en un clic et connectez-vous avec d'autres participants."
                  )}
                </p>
              </div>

              <div className="feature">
                <i className="fas fa-comments"></i>
                <h3>{t("Interaction en temps réel")}</h3>
                <p>
                  {t(
                    "Discutez et échangez avec les autres membres via notre espace de discussion."
                  )}
                </p>
              </div>
            </div>
            <div className="home-buttons">
              <Link to="/events" className="consult-home">
                {t("Consultez nos Annonces")}
                <FaArrowRightLong className="arrow-icon-home" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
