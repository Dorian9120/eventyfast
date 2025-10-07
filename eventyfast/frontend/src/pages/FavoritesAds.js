import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/FavoritesAds.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCity,
  FaUserFriends,
  FaCalendarAlt,
  FaRegClock,
} from "react-icons/fa";

const FavoritesAds = () => {
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [participatedEvents, setParticipatedEvents] = useState([]);
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (storedUserId) {
      setUserId(storedUserId);
      console.log("Utilisateur trouvé, ID:", storedUserId);
    } else {
      console.error("Aucun ID utilisateur trouvé");
    }
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        try {
          const favoritesResponse = await axios.get(
            `http://localhost:3000/api/favorites/${userId}`
          );

          const fetchedFavorites = favoritesResponse.data;
          setFavorites(fetchedFavorites);

          const updatedEvents = fetchedFavorites.map((fav) => ({
            ...fav.event,
            isFavorite: true,
          }));

          setEvents(updatedEvents);

          console.log("✅ Favoris et événements mis à jour :", updatedEvents);
        } catch (error) {
          console.error(
            "❌ Erreur lors de la récupération des événements ou favoris :",
            error
          );
        } finally {
          setTimeout(() => {
            setLoading(false);
            setIsSimulatedLoading(false);
          }, 1000);
        }
      };

      fetchData();
    }
  }, [userId]);

  const handleParticipate = async (eventId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `http://localhost:3000/api/events/${eventId}/participant`,
        { userId },
        { withCredentials: true }
      );

      setEvents((prevEvents) => {
        return prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, participants: response.data.participants }
            : event
        );
      });
      toast.success("Vous êtes maintenant inscrit à cet événement !");
    } catch (error) {
      console.error("Erreur lors de la participation:", error);

      if (error.response) {
        const { status, data } = error.response;
        if (status === 400) {
          toast.error(data.message);

          if (data.message === "Vous êtes déjà inscrit à cet événement.") {
            setParticipatedEvents((prev) => [...prev, eventId]);
            return;
          }
        } else if (status === 403) {
          toast.error("Accès refusé. Veuillez vous connecter.");
          navigate("/login");
        } else {
          toast.error("Une erreur est survenue lors de votre inscription.");
        }
      } else {
        toast.error("Erreur de connexion au serveur.");
      }
    }
  };

  const handleDeleteFavorite = async (eventId) => {
    try {
      console.log("🔴 Requête DELETE avec :", { userId, eventId });

      const response = await axios.delete(
        "http://localhost:3000/api/favorites/delete",
        {
          data: { userId, eventId },
        }
      );

      console.log("✅ Favori supprimé de la BDD", response.data);

      setFavorites((prevFavorites) => {
        const updatedFavorites = prevFavorites.filter(
          (fav) => fav.eventId !== eventId
        );
        console.log("🟡 Mise à jour locale des favoris :", updatedFavorites);
        return updatedFavorites;
      });

      setEvents((prevEvents) => {
        const updatedEvents = prevEvents.filter(
          (event) => event.id !== eventId
        );
        console.log("🟢 Mise à jour locale des événements :", updatedEvents);
        return updatedEvents;
      });

      setLoading(false);

      toast.success("Événement supprimé des favoris avec succès !");
    } catch (error) {
      console.error(
        "❌ Erreur lors de la suppression du favori:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="favorites-container">
      <div className="favorites-section">
        <h2>Mes Favoris ❤️</h2>
        {isSimulatedLoading ? (
          <div className="skeleton-container">
            {[...Array(favorites.length)].map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-text"></div>
                <div className="skeleton-text small"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-button"></div>
              </div>
            ))}
          </div>
        ) : favorites && favorites.length === 0 ? (
          <p style={{ justifyContent: "center" }}>
            Aucun favori pour le moment.
          </p>
        ) : (
          <div className="favorites-list">
            {favorites.map((fav) => (
              <div
                key={fav.eventId}
                className="favorite-item"
                onClick={() => navigate(`/event-details/${fav.eventId}`)}
              >
                <h3>{fav.title}</h3>
                <div className="image-preview"></div>
                <p className="description"> {fav.description}</p>
                <p>
                  <strong>
                    <FaCalendarAlt /> Date :{" "}
                  </strong>
                  {formatDate(fav.date)}
                </p>
                <p>
                  <strong>
                    <FaRegClock /> Heure :{" "}
                  </strong>{" "}
                  {fav.hours}
                </p>
                <p>
                  <strong>
                    <FaCity /> Lieu :{" "}
                  </strong>
                  {fav.location}
                </p>
                <p>
                  <strong>
                    <FaUserFriends /> Organisateur(s) :{" "}
                  </strong>{" "}
                  {fav.organizers}
                </p>
                <button
                  className="btn-participate"
                  onClick={() => handleParticipate(fav.eventId)}
                >
                  Participer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default FavoritesAds;
