import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FaCalendarAlt,
  FaCity,
  FaComments,
  FaUsers,
  FaRegClock,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/EventDetails.css";

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/events/${eventId}`
        );
        const eventData = response.data;

        const isUserParticipating = eventData.participants.some(
          (participants) => Number(participants.userId) === Number(userId)
        );

        setEvent({
          ...eventData.event,
          participants: eventData.participants,
          isUserParticipating,
        });
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des détails de l'événement:",
          err
        );
        setError("Impossible de récupérer les détails de l'événement.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const handleParticipate = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/api/events/${eventId}/participant`,
        { userId },
        { withCredentials: true }
      );

      setEvent((prevEvent) => ({
        ...prevEvent,
        participants: response.data.participants,
      }));

      toast.success("Vous êtes maintenant inscrit à cet événement !");
    } catch (error) {
      console.error("Erreur lors de la participation:", error);

      if (error.response) {
        const { status, data } = error.response;
        if (status === 400) {
          toast.error(data.message);
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

  // if (loading) return <p>Chargement des détails...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="event-details-container">
      <div className="event-details">
        {event && (
          <>
            <h2>{event.title}</h2>
            <p>{event.description}</p>
            <p>
              <FaCalendarAlt /> <strong>Date : </strong>
              {new Date(event.date).toLocaleDateString("fr-FR")}
            </p>
            <p className="hours">
              <FaRegClock /> <strong>Heure : </strong>
              {event.hours}
            </p>
            <p>
              <FaCity /> <strong>Lieu : </strong> {event.location}
            </p>
            <p>
              <FaUsers /> <strong>Participants : </strong>
              {event.participants.length} / {event.nombreMaxParticipants}
            </p>

            <p>
              <strong>Organisateurs :</strong>{" "}
              {event.organizers ? event.organizers : "Non spécifier"}
            </p>

            {event.participants >= event.nombreMaxParticipants ? (
              <p className="event-full">L'événement est complet</p>
            ) : (
              <div className="buttons-container">
                <button
                  className="btn-chat"
                  onClick={() => {
                    const user = localStorage.getItem("userId");
                    if (!user) {
                      navigate("/login");
                    } else {
                      navigate(`/chat-event/${eventId}`);
                    }
                  }}
                >
                  <FaComments /> Poser une question
                </button>

                {event.isUserParticipating ? (
                  <p className="already-participate">
                    ℹ️ Vous participez à cet évenement.
                  </p>
                ) : (
                  <button
                    className="btn-participate"
                    onClick={handleParticipate}
                  >
                    Participer
                  </button>
                )}
              </div>
            )}
          </>
        )}

        <ToastContainer />
      </div>
    </div>
  );
};

export default EventDetails;
