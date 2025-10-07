import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Notifs.css";

const Notifs = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/notifications/${userId}`,
          {
            withCredentials: true,
          }
        );
        if (Array.isArray(response.data)) {
          setNotifications(response.data);
        } else {
          console.error(
            "Les notifications ne sont pas un tableau",
            response.data
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des notifications:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification || !notification.type) {
        console.error("Notification invalide ou sans type", notification);
        return;
      }
      await axios.put(
        `http://localhost:3000/api/notifications/${notification.id}/read`
      );
      const eventId = notification.eventId;
      if (String(notification.type) === "event_full") {
        navigate(`/event-participant/${eventId}`);
      } else if (String(notification.type) === "chat") {
        navigate("/chat");
      }
    } catch (error) {
      console.error("Erreur lors de la gestion de la notification:", error);
    }
  };

  // if (loading) {
  //   return <div>Chargement des notifications...</div>;
  // }

  return (
    <div className="notifs-global-container">
      <div className="notifs-container">
        <h2>Notifications</h2>
        {notifications.length === 0 ? (
          <p>Aucune notification pour le moment.</p>
        ) : (
          <ul>
            {notifications.map((notif) => (
              <li
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  cursor: "pointer",
                  backgroundColor: notif.isRead ? "lightgrey" : "lightblue",
                  padding: "10px",
                  margin: "5px",
                  borderRadius: "5px",
                }}
              >
                {notif.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifs;
