import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, NavLink, useLocation } from "react-router-dom";
import { FaComments, FaBell } from "react-icons/fa";
import "../styles/Header.css";
import axios from "axios";
import { useTranslation } from "react-i18next";
import "react-toastify/dist/ReactToastify.css";
import i18n from "../i18n";

const Header = () => {
  const navigate = useNavigate();
  const [backgroundColor, setBackgroundColor] = useState("");
  const [initial, setInitial] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const profileMenuRef = useRef(null);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const location = useLocation();
  const { t } = useTranslation();
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  console.log(username);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    const handleStorageChange = () => {};
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateUserInfo = () => {
    if (username) {
      setInitial(username.charAt(0).toUpperCase());

      let savedColor = localStorage.getItem(`userColor_${username}`);
      if (!savedColor) {
        savedColor = getRandomColor();
        localStorage.setItem(`userColor_${username}`, savedColor);
      }
      setBackgroundColor(savedColor);
    } else {
      setInitial("");
      setBackgroundColor("");
    }
  };

  useEffect(() => {
    updateUserInfo();
  }, [username]);

  const getRandomColor = () => {
    let color;
    do {
      color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    } while (isColorTooLight(color));
    return color;
  };

  const isColorTooLight = (color) => {
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);

    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    return brightness > 0.75;
  };

  const fetchNotifications = async () => {
    const userId = localStorage.getItem("userId");
    try {
      const response = await axios.get(
        `http://localhost:3000/api/notifications/${userId}`,
        {
          withCredentials: true,
        },
        {
          params: { userId: localStorage.getItem("userId") },
        }
      );

      const unread = response.data.filter((notif) => !notif.read);
      setUnreadNotifications(unread.length);
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications", error);
    }
  };

  const markNotificationAsRead = async (notifId) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/notifications/${notifId}/read`,
        {},
        {
          withCredentials: true,
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification", error);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Êtes-vous sûr de vouloir vous déconnecter ?"
    );

    if (confirmLogout) {
      await axios.post("http://localhost:3000/api/logout", {
        withCredentials: true,
      });
      document.cookie =
        "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("role");

      setBackgroundColor("");
      setProfileMenuOpen(false);

      setIsLoggedOut(true);
      navigate("/");
    }
  };

  useEffect(() => {
    if (username) fetchNotifications();
  }, [username, location]);

  useEffect(() => {
    if (isLoggedOut) {
      window.location.reload();
      setIsLoggedOut(false);
    }
  }, [isLoggedOut]);

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const changeLanguageAndCloseMenu = (lang) => {
    i18n.changeLanguage(lang);
    document.querySelector(".language-switcher").removeAttribute("open");
  };

  const isAdmin = role === "admin";

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo-container">
          <img src="/logo.png" alt="EventyFast Logo" className="logo" />
        </Link>

        <div className="nav-links">
          <div className="nav1">
            {isAdmin && (
              <NavLink
                to="/users"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Users
              </NavLink>
            )}
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              {t("home")}
            </NavLink>

            <NavLink
              to="/events"
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              {t("events")}
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `hide-on-mobile ${isActive ? "active-link" : ""}`
              }
            >
              {t("contact")}
            </NavLink>

            <details className="language-switcher hide-on-mobile">
              <summary className="lang-button">🌍 Language</summary>
              <div className="lang-menu">
                <button onClick={() => changeLanguageAndCloseMenu("fr")}>
                  Français
                </button>
                <button onClick={() => changeLanguageAndCloseMenu("en")}>
                  English
                </button>
              </div>
            </details>

            {!username && (
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                {t("Se connecter")}
              </NavLink>
            )}
          </div>

          {username && (
            <div className="icons-container">
              <Link to="/chat">
                <FaComments className="icon" />
              </Link>

              <Link to="/notifs" onClick={() => markNotificationAsRead()}>
                <div className="notif-icon-container">
                  <FaBell className="icon" />
                  {unreadNotifications > 0 && (
                    <span className="notif-badge">{unreadNotifications}</span>
                  )}
                </div>
              </Link>
            </div>
          )}

          {username && (
            <div className="user-info">
              <div
                className="user-circle"
                style={{ backgroundColor: backgroundColor }}
                onClick={toggleProfileMenu}
              >
                {initial}
              </div>

              {/* Menu déroulant pour le profil */}
              {profileMenuOpen && (
                <div ref={profileMenuRef} className="profile-menu">
                  <div className="profile-links">
                    <Link to="/profile">
                      <span className="icon">👤</span> {t("profile")}
                    </Link>

                    <Link to="/favorites-ads">
                      <span className="icon">❤️</span> {t("favorites")}
                    </Link>

                    <Link to="/my-ads">
                      <span className="icon">📋</span> {t("myAds")}
                    </Link>

                    <Link to="/event-participation">
                      <span className="icon">🎟️</span> {t("eventParticipation")}
                    </Link>

                    <Link to="/settings">
                      <span className="icon">⚙️</span> {t("settings")}
                    </Link>

                    <button onClick={handleLogout} className="logout-button">
                      <span className="icon">🚪</span> {t("logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
