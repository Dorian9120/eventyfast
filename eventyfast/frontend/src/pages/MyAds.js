import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import CreateEventForm from "../components/CreateEventForm";
import { FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/MyAds.css";
import {
  FaCity,
  FaUserFriends,
  FaCalendarAlt,
  FaRegClock,
  FaUsers,
  FaCamera,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

const MyAds = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;
    const fetchEvents = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/events/user/${userId}`
        );

        setEvents(response.data);
      } catch (error) {
        setError("Erreur lors de la récupération des événements.");
      } finally {
        setTimeout(() => {
          setLoading(false);
          setIsSimulatedLoading(false);
        }, 2000);
      }
    };
    fetchEvents();
  }, [userId]);

  const handleDelete = async (eventId) => {
    const confirmDelete = window.confirm(
      "Êtes-vous sûr de vouloir supprimer votre événement ?"
    );
    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/events/${eventId}`);
      setEvents(events.filter((event) => event.id !== eventId));
      toast.success("Votre évenement a été supprimer.");
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'événement.");
    }
  };

  const handleAddEvent = (newEvent) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
    setShowCreateForm(false);
  };

  const handleEdit = (eventId) => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleImageChange = async (e, eventId) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      try {
        const response = await axios.post(
          `http://localhost:3000/api/events/${eventId}/upload-image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const updatedImageUrl = response.data.imageUrl;
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId ? { ...event, image: updatedImageUrl } : event
          )
        );
      } catch (error) {
        toast.error("Erreur lors du téléchargement de l'image.");
      }
    }
  };

  const handleDeleteImage = async (eventId) => {
    try {
      await axios.delete(
        `http://localhost:3000/api/events/${eventId}/delete-image`
      );
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, image: null } : event
        )
      );
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'image.");
    }
  };

  const isEventPast = (eventDate, eventHours) => {
    const currentDate = new Date();
    const fullEventDate = new Date(`${eventDate}T${eventHours}:00`);
    return fullEventDate < currentDate;
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="my-ads-container">
      <div className="my-ads">
        <h2 className="h2-my-ads">{t("Mes annonces")}</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-ad-btn"
        >
          {showCreateForm ? t("Annuler") : t("Créer un Événement")}
        </button>

        {showCreateForm && (
          <CreateEventForm userId={userId} onAddEvent={handleAddEvent} />
        )}

        {isSimulatedLoading ? (
          <div className="skeleton-container">
            {[...Array(events.length || 1)].map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-image"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text small"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-button"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p>{t("Aucun événement trouvé.")}</p>
        ) : (
          <div className="ads-list">
            {events.map((event) => (
              <div key={event.id} className="ad-item">
                <button
                  className="delete-event"
                  onClick={() => handleDelete(event.id)}
                >
                  <FaTimes className="trash-icon" />
                </button>
                <h3>{event.title}</h3>
                <h4>{event.description}</h4>

                <div className="event-image-upload">
                  {event.image ? (
                    <div className="image-preview-myads">
                      <img
                        className="image-myads"
                        src={`http://localhost:3000${event.image}`}
                        alt="Image de l'événement"
                      />
                      <button
                        onClick={() => handleDeleteImage(event.id)}
                        className="delete-image-btn"
                      >
                        {t("Supprimer l'image")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <FaCamera className="FaCamera" />
                      <label
                        htmlFor={`event-image-${event.id}`}
                        style={{ margin: "10px 20px" }}
                      >
                        {t("Ajouter une image")} :
                      </label>
                      <input
                        style={{ margin: "10px 20px" }}
                        type="file"
                        id={`event-image-${event.id}`}
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, event.id)}
                      />
                    </>
                  )}
                </div>
                <p>
                  <FaCalendarAlt />{" "}
                  <span style={{ fontWeight: "bold" }}>Date :</span>{" "}
                  {formatDate(event.date)}
                </p>
                <p>
                  <FaRegClock />{" "}
                  <span style={{ fontWeight: "bold" }}>Heure :</span>{" "}
                  {event.hours}
                </p>
                <p>
                  <FaCity />{" "}
                  <span style={{ fontWeight: "bold" }}>{t("Lieu")}</span>{" "}
                  {event.location}
                </p>
                <p>
                  <FaUserFriends />{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {t("Organisateurs")}
                  </span>{" "}
                  {event.organizers}
                </p>
                <p>
                  <FaUsers />{" "}
                  <span style={{ fontWeight: "bold" }}>Participants :</span>{" "}
                  {event.participants} / {event.nombreMaxParticipants}
                </p>

                {isEventPast(event.date, event.hours) ? (
                  <div className="event-passed-my-ads">
                    <p style={{ textAlign: "center" }}>
                      {t("Cet événement est déjà passé")}
                    </p>
                    <button onClick={() => handleDelete(event.id)}>
                      {t("Delete")}
                    </button>
                  </div>
                ) : (
                  <div className="ad-item-btn">
                    <div className="ad-item-btn1">
                      <button onClick={() => handleEdit(event.id)}>
                        {t("Update")}
                      </button>
                      <Link
                        to={`/event-participant/${event.id}`}
                        className="evt-participant-btn"
                      >
                        {t("Voir les participants")}
                      </Link>
                    </div>
                  </div>
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

export default MyAds;
