import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/EditEvent.css";

const EditEvents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [updatedEvent, setUpdatedEvent] = useState({
    title: "",
    description: "",
    date: "",
    hours: "",
    location: "",
    organizers: "",
    nombreMaxParticipants: "",
  });

  const userId = localStorage.getItem("userId");
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/events/${id}`
        );

        setEvent(response.data.event);
        setUpdatedEvent(response.data.event);
        console.log("Réponse de l'API:", response.data);

        if (response.data.event.userId.toString() !== userId.toString()) {
          setError("Vous n'êtes pas autorisé à modifier cet événement.");
        }
      } catch (err) {
        console.error("Erreur de récupération de l'événement : ", err);
        setError("Erreur lors de la récupération de l'événement.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    } else {
      setError("ID de l'événement manquant.");
      setLoading(false);
    }
  }, [id, userId]);

  const handleChange = (e) => {
    setUpdatedEvent({
      ...updatedEvent,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      const response = await axios.put(
        `http://localhost:3000/api/events/${id}`,
        updatedEvent,
        {
          withCredentials: true,
        }
      );
      setSuccessMessage(
        "Événement mis à jour avec succès. Redirection automatique..."
      );
      setTimeout(() => {
        navigate("/my-ads");
      }, 1500);
    } catch (err) {
      setError("Impossible de modifier l'événement.");
      console.error(
        "Erreur lors de la mise à jour de l'événement:",
        err.response || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <div className="edit-event-container">
      <div className="edit-event">
        <h2>Modifier l'événement</h2>
        <form className="form-edit-event" onSubmit={handleSubmit}>
          <div>
            <label>Titre</label>
            <input
              type="text"
              name="title"
              value={updatedEvent.title}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              name="description"
              value={updatedEvent.description}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={updatedEvent.date}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Lieu</label>
            <input
              type="text"
              name="location"
              value={updatedEvent.location}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Heure</label>
            <input
              type="time"
              name="hours"
              value={updatedEvent.hours}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Organisateur(s)</label>
            <input
              type="text"
              name="organizers"
              value={updatedEvent.organizers}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Nombre Max de Participants</label>
            <input
              type="number"
              name="nombreMaxParticipants"
              value={updatedEvent.nombreMaxParticipants}
              onChange={handleChange}
            />
          </div>
          <button type="submit">Sauvegarder</button>
        </form>
        {successMessage && (
          <div className="success-message-edit-event">{successMessage}</div>
        )}
      </div>
    </div>
  );
};

export default EditEvents;
