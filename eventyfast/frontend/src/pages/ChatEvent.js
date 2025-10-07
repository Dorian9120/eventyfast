import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "../styles/ChatEvent.css";
import "react-toastify/dist/ReactToastify.css";

const ChatEvent = () => {
  const { eventId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/chat/event/${eventId}`
        );
        setMessages(response.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [eventId]);

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");

    if (!newMessage) {
      toast.error("Veuillez entrer un message.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:3000/api/chat/ask",
        { content: newMessage, userId, eventId },
        { withCredentials: true }
      );
      toast.success("Votre question a été envoyée.");
      setNewMessage("");
      const response = await axios.get(
        `http://localhost:3000/api/chat/event/${eventId}`
      );
      setMessages(response.data);
    } catch (error) {}
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="chat--global-container">
      <div className="chat-container">
        <h2>💬 Questions sur l'événement</h2>

        <form onSubmit={handleMessageSubmit} className="chat-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Posez votre question..."
          />
          <button type="submit">
            <FaPaperPlane />
          </button>
        </form>

        <div className="messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className="message">
              <p className="message-content">
                <strong>{msg.author} :</strong> {msg.content}
              </p>
              <span className="message-date">
                {new Date(msg.createdAt).toLocaleString("fr-FR")}
              </span>
            </div>
          ))}
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default ChatEvent;
