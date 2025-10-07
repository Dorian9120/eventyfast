import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/EventParticipation.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EventParticipation = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!userId) {
          setError("Utilisateur non authentifié");
          return;
        }
        const response = await axios.get(
          `http://localhost:3000/api/events/participation/${userId}`
        );
        setEvents(response.data);
        setLoading(true);
      } catch (err) {
        console.error("Erreur lors de la récupération des événements", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [userId]);

  const CancelParticipation = async (eventId) => {
    if (!eventId) {
      console.log("Erreur: ID de l'événement manquant.", eventId);
      return;
    }
    try {
      if (!userId) {
        setError("Utilisateur non authentifié");
        return;
      }

      const response = await axios.delete(
        `http://localhost:3000/api/events/${eventId}/participant/${userId}`
      );
      if (response.status === 200) {
        setEvents(events.filter((event) => event.id !== eventId));
        toast.success("Votre participation a été annulée avec succès.");
      }
    } catch (err) {
      console.error("Erreur lors de l'annulation de la participation", err);
      setError(
        "Une erreur est survenue lors de l'annulation de la participation."
      );
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (loading) {
    return <div>Chargement de vos participations</div>;
  }

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="event-participation-container">
      <div className="event-participation">
        <h2 className="title">Événements auxquels vous participez</h2>
        {events.length === 0 ? (
          <p className="no-events-message">
            Vous ne participez à aucun événement pour le moment.
          </p>
        ) : (
          <ul className="event-list">
            {events.map((event) => {
              return (
                <li key={event.id} className="event-item">
                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  <p className="event-date">
                    {" "}
                    <strong>Date : </strong>
                    {formatDate(event.date)}
                  </p>
                  <p className="event-date">
                    <strong>Heure : </strong>
                    {event.hours}
                  </p>
                  <p className="event-location">
                    <strong>Lieu : </strong>
                    {event.location}
                  </p>
                  <p className="event-organizers">
                    <strong>Organisateurs : </strong>{" "}
                    {event.organizers || "Non spécifiés"}
                  </p>
                  <button
                    className="cancel-participation-btn"
                    onClick={() => {
                      CancelParticipation(event.id);
                    }}
                  >
                    Annuler la participation
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default EventParticipation;
