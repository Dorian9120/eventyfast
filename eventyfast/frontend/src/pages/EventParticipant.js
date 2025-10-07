import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/EventParticipant.css";
import { FaArrowLeft } from "react-icons/fa";

const EventParticipant = () => {
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/events/${eventId}/participant`,
          {
            withCredentials: true,
          }
        );
        setParticipants(response.data.participants);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [eventId]);

  const goBackStep = () => {
    navigate("/my-ads");
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="event-participant-container">
      <div className="event-participant">
        <FaArrowLeft
          style={{ color: "black" }}
          className="close-icon"
          onClick={goBackStep}
        />
        <h1>
          Participants de l'événement :{" "}
          {participants.length > 0 ? participants[0].Event.title : ""}
        </h1>
        {loading ? (
          <div style={{ textAlign: "center" }}>
            Chargement des participants...
          </div>
        ) : Array.isArray(participants) && participants.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => {
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{participant.User.username}</td>
                    <td>{participant.User.email}</td>
                    <td>{participant.User.phone}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div>Aucun participant pour le moment</div>
        )}
      </div>
    </div>
  );
};

export default EventParticipant;
