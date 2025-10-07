import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Events.css";
import { FaCity, FaCalendarAlt, FaHeart, FaRedoAlt } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { regions, departments } from "../locales/locations";

const dateFilters = ["Aujourd'hui", "Cette semaine", "Ce mois-ci"];
const category = [
  { id: 1, name: "Concert", icon: "fa-music" },
  { id: 2, name: "Festival", icon: "fa-fire" },
  { id: 3, name: "Spectacle", icon: "fa-theater-masks" },
  { id: 4, name: "Sport", icon: "fa-futbol" },
  { id: 5, name: "Conférence", icon: "fa-chalkboard-teacher" },
  { id: 6, name: "Atelier", icon: "fa-tools" },
];

const Events = ({ favorites, setFavorites, searchEvent, setSearchEvent }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const userId = localStorage.getItem("userId");
  const { t } = useTranslation();

  useEffect(() => {
    const savedFavorites =
      JSON.parse(localStorage.getItem(`favorites_${userId}`)) || [];

    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/events");

        const updatedEvents = response.data.map((event) => ({
          ...event,
          isFavorite: savedFavorites.some((fav) => fav.id === event.id),
        }));

        setEvents(updatedEvents);
        setFavorites(savedFavorites);
      } catch (error) {
        console.error("Erreur lors de la récupération des événements:", error);
        setError("Impossible de récupérer les événements.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [userId]);

  const toggleFavorite = async (event) => {
    const isFavorite = favorites.some((fav) => fav.id === event.id);

    try {
      if (isFavorite) {
        await axios.delete("http://localhost:3000/api/favorites/delete", {
          data: { userId, eventId: event.id },
        });

        setFavorites((prevFavorites) => {
          const updatedFavorites = prevFavorites.filter(
            (fav) => fav.id !== event.id
          );
          localStorage.setItem(
            `favorites_${userId}`,
            JSON.stringify(updatedFavorites)
          );
          return updatedFavorites;
        });

        setEvents((prevEvents) =>
          prevEvents.map((e) =>
            e.id === event.id ? { ...e, isFavorite: false } : e
          )
        );
      } else {
        await axios.post("http://localhost:3000/api/favorites/add", {
          userId,
          eventId: event.id,
        });

        setFavorites((prevFavorites) => {
          const updatedFavorites = [...prevFavorites, event];
          localStorage.setItem(
            `favorites_${userId}`,
            JSON.stringify(updatedFavorites)
          );
          return updatedFavorites;
        });

        setEvents((prevEvents) =>
          prevEvents.map((e) =>
            e.id === event.id ? { ...e, isFavorite: true } : e
          )
        );
      }
    } catch (error) {
      if (error.response) {
        const errorMessage =
          error.response.data.message ||
          "Erreur inconnue lors de la gestion des favoris.";

        if (errorMessage === "Vous ne pouvez pas liker votre propre annonce.") {
          toast.error(errorMessage);
        } else {
          toast.error("Vous devez être connecter pour liker un évenement.");
        }
      } else if (error.request) {
      } else {
        console.error(
          "Erreur dans la configuration de la requête:",
          error.message
        );
      }
    }
  };

  const filterByDate = (eventDate, filter) => {
    const eventDateObj = new Date(eventDate);
    const currentDate = new Date();

    currentDate.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(currentDate.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(currentDate);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    switch (filter) {
      case "Aujourd'hui":
        eventDateObj.setHours(0, 0, 0, 0);
        return eventDateObj.getTime() === currentDate.getTime();

      case "Cette semaine":
        eventDateObj.setHours(0, 0, 0, 0);
        return eventDateObj >= startOfWeek && eventDateObj <= endOfWeek;

      case "Ce mois-ci":
        const isSameMonth =
          eventDateObj.getMonth() === currentDate.getMonth() &&
          eventDateObj.getFullYear() === currentDate.getFullYear();
        return isSameMonth;

      default:
        return true;
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchEvent.toLowerCase()) ||
      event.location.toLowerCase().includes(searchEvent.toLowerCase()) ||
      event.description.toLowerCase().includes(searchEvent.toLowerCase());

    const matchesCategory = selectedCategory
      ? event.categoryId === selectedCategory
      : true;

    const matchesDate = selectedDate
      ? filterByDate(event.date, selectedDate)
      : true;

    const matchesRegion = selectedRegion
      ? event.region === selectedRegion
      : true;

    const matchesDepartment = selectedDepartment
      ? event.department === selectedDepartment
      : true;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesDate &&
      matchesRegion &&
      matchesDepartment
    );
  });

  const isEventPast = (eventDate, eventHours) => {
    const currentDate = new Date();
    const fullEventDate = new Date(`${eventDate}T${eventHours}:00`);

    return fullEventDate < currentDate;
  };

  const handleLogin = (e) => {
    if (!userId) {
      e.preventDefault();
      navigate("/login");
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="event-global-container">
      <div className="event-container">
        <div className="event-block">
          <div className="event-text">
            <h2 className="events-h2">{t("events")} 🎶🎊</h2>
            <p className="events-subtext">
              {t("Participez aux événements près de chez vous !")} <br></br>
              {t(
                "Ne manquez aucune occasion de vivre des moments inoubliables"
              )}
            </p>
            <Link
              to="/my-ads"
              className="auth-button"
              style={{
                background: "#2c3e50",
                marginBottom: "20px",
              }}
              onClick={handleLogin}
            >
              {t("Créer un Événement")}
            </Link>
          </div>
          <img
            src="/fete.png"
            alt="Événement festif"
            className="event-image hide-on-mobile"
          />
        </div>

        <div className="anim-left">
          <h3 className="search-title">
            {t("Trouvez l'événement qui vous convient en un clic")}
          </h3>
          <div className="search-container">
            <input
              type="text"
              placeholder={t("Rechercher un évenement")}
              value={searchEvent}
              onChange={(e) => setSearchEvent(e.target.value)}
            />
            <i className="search-icon fas fa-search"></i>
          </div>

          <div className="filters-container">
            {/* <h3 className="search-title">{t("Filtrer les événements")}</h3> */}

            <div className="filters">
              {category.map((category) => (
                <button
                  key={category.id}
                  className={`filter-btn ${
                    selectedCategory === category.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <i className={`fas ${category.icon}`}></i>
                  <span>{category.name}</span>{" "}
                </button>
              ))}
            </div>

            <div className="filters">
              {dateFilters.map((date) => (
                <button
                  key={date}
                  className={`filter-btn-date ${
                    selectedDate === date ? "active" : ""
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  {date}
                </button>
              ))}
            </div>
            <div className="select-container">
              {/* Sélection de la région */}
              <select
                onChange={(e) => setSelectedRegion(e.target.value)}
                value={selectedRegion}
              >
                <option value="">Toutes les régions</option>
                {regions.map((region) => (
                  <option key={region.name} value={region.name}>
                    {region.name}
                  </option>
                ))}
              </select>

              {/* Sélection du département */}
              <select
                onChange={(e) => setSelectedDepartment(e.target.value)}
                value={selectedDepartment}
                disabled={!selectedRegion}
              >
                <option value="">Tous les départements</option>
                {departments
                  .filter((dep) => dep.region === selectedRegion)
                  .map((dep) => (
                    <option key={dep.name} value={dep.name}>
                      {dep.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              className="reset-btn"
              onClick={() => {
                setSearchEvent("");
                setSelectedCategory("");
                setSelectedDate("");
                setSelectedRegion("");
                setSelectedDepartment("");
                setSelectedLocation("");
              }}
              style={{
                display:
                  !searchEvent &&
                  !selectedCategory &&
                  !selectedDate &&
                  !selectedRegion &&
                  !selectedDepartment
                    ? "none"
                    : "block",
              }}
            >
              <FaRedoAlt className="reset-icon" />{" "}
              {t("Réinitialiser les filtres")}
            </button>
          </div>
        </div>

        <div className="separator"></div>

        {loading && <p>{t("Chargement des événements")}</p>}

        {error && <p>{error}</p>}

        {filteredEvents.length === 0 ? (
          <p className="no-events-found">
            {t("Aucun évenement trouvé")}
            <img src="no_events_found_gif.gif" alt="Image d'erreur" />
          </p>
        ) : (
          <div className="events-list">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`event-item ${
                  isEventPast(event.date, event.hours) ? "past-event" : ""
                }`}
              >
                <h3>{event.title}</h3>
                <div className="image-preview">
                  <div className="event-image-upload">
                    {event.image ? (
                      <div className="image-preview">
                        <img
                          src={`http://localhost:3000${event.image}`}
                          alt="Image de l'événement"
                          style={{
                            width: "100%",
                            maxHeight: "200px",
                            minWidth: "350px",
                            objectFit: "cover",
                            marginTop: "10px",
                            borderRadius: "10px",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="image-preview default-image">
                        <i
                          className="fas fa-camera"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "100px",
                            width: "100%",
                            height: "200px",
                          }}
                        ></i>
                        <p style={{ textAlign: "center", color: "#aaa" }}>
                          {t("Aucune image disponible")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ fontWeight: "600" }}>{event.description}</p>
                <p className="date">
                  <FaCalendarAlt /> <strong>Date : </strong>
                  {formatDate(event.date)}
                </p>

                <p className="location">
                  <FaCity /> <strong>{t("Lieu")}</strong> {event.location}
                </p>
                <button
                  className={`like-btn ${event.isFavorite ? "liked" : ""}`}
                  onClick={() => toggleFavorite(event)}
                >
                  <FaHeart />
                </button>

                {isEventPast(event.date, event.hours) ? (
                  <p className="event-passed">
                    {t("Cet événement est déjà passé")}
                  </p>
                ) : (
                  <Link
                    to={`/event-details/${event.id}`}
                    className="evt-details-btn"
                  >
                    {t("Voir les détails")}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default Events;
