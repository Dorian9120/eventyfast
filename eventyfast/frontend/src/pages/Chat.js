import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Chat.css";

const Chat = () => {
  const [userChats, setUserChats] = useState([]);
  const [eventTitles, setEventTitles] = useState({});
  const [organizerChats, setOrganizerChats] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [selectedTab, setSelectedTab] = useState("organizerChats");
  const [userChatsLoading, setUserChatsLoading] = useState(true);
  const [organizerChatsLoading, setOrganizerChatsLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUserChats = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/chat/user/${userId}`,
          {
            withCredentials: true,
          }
        );

        const chatsByEvent = {};

        for (let chat of response.data) {
          const eventTitle = chat.Event?.title || "Chargement...";

          if (!chatsByEvent[chat.eventId]) {
            chatsByEvent[chat.eventId] = {
              eventId: chat.eventId,
              eventTitle: eventTitle,
              chats: [],
            };
          }

          chatsByEvent[chat.eventId].chats.push(chat);
        }

        setUserChats(Object.values(chatsByEvent));
      } catch (error) {
        console.error(
          "Erreur lors du chargement des discussions utilisateur",
          error
        );
      } finally {
        setUserChatsLoading(false);
      }
    };

    const fetchOrganizerChats = async () => {
      try {
        const eventsResponse = await axios.get(
          `http://localhost:3000/api/events/user/${userId}`,
          {
            withCredentials: true,
          }
        );

        const events = eventsResponse.data;
        const chatsByEvent = {};

        for (let event of events) {
          const chatResponse = await axios.get(
            `http://localhost:3000/api/chat/event/${event.id}`,
            {
              withCredentials: true,
            }
          );

          for (let chat of chatResponse.data) {
            if (!chatsByEvent[chat.eventId]) {
              chatsByEvent[chat.eventId] = {
                eventId: chat.eventId,
                eventTitle: event.title,
                chats: [],
              };
            }

            chatsByEvent[chat.eventId].chats.push(chat);
          }
        }

        setOrganizerChats(Object.values(chatsByEvent));
      } catch (error) {
        console.error(
          "Erreur lors du chargement des chats organisateurs",
          error
        );
      } finally {
        setOrganizerChatsLoading(false);
      }
    };

    fetchUserChats();
    fetchOrganizerChats();
  }, [userId, eventTitles]);

  const handleReplyChange = (chatId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [chatId]: value,
    }));
  };

  const handleSendReply = async (chatId) => {
    const content = replyInputs[chatId];

    if (!content) {
      toast.error("Votre réponse ne peut pas être vide.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/api/chat/reply/${chatId}`,
        { content },
        { withCredentials: true }
      );

      setOrganizerChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? { ...chat, response: [...(chat.response || []), response.data] }
            : chat
        )
      );

      setReplyInputs((prev) => ({
        ...prev,
        [chatId]: "",
      }));

      toast.success("Réponse envoyée !");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la réponse.");
    }
  };

  return (
    <div className="user-chats-global-container">
      <div className="user-chats-container">
        <div className="tabs">
          <button
            className={selectedTab === "organizerChats" ? "active" : ""}
            onClick={() => setSelectedTab("organizerChats")}
          >
            Questions reçues sur mes événements
          </button>
          <button
            className={selectedTab === "userChats" ? "active" : ""}
            onClick={() => setSelectedTab("userChats")}
          >
            Mes messages
          </button>
        </div>

        {selectedTab === "organizerChats" && (
          <div>
            <h2>Questions reçues sur mes événements</h2>
            {organizerChatsLoading ? (
              <p>Chargement des questions...</p>
            ) : organizerChats.length === 0 ? (
              <p>Aucune question reçue pour vos événements.</p>
            ) : (
              <div>
                {organizerChats.map((chatGroup) => (
                  <div key={chatGroup.eventId} className="chat-item">
                    <h4>Événement : {chatGroup.eventTitle}</h4>

                    {chatGroup.chats
                      .filter((chat) => chat.userId !== userId)
                      .map((chat) => (
                        <div key={chat.id} className="question-item">
                          <p>
                            <strong>
                              {chat.userId.toString() === userId.toString()
                                ? "Vous"
                                : `${chat.User.username}`}{" "}
                              :
                            </strong>{" "}
                            {chat.content}
                          </p>

                          {chat.response && chat.response.length > 0 && (
                            <div className="responses">
                              {chat.response.map((reply) => (
                                <div key={reply.id} className="response-item">
                                  <p>
                                    <strong>
                                      {reply.userId.toString() ===
                                      userId.toString()
                                        ? "Vous"
                                        : `${reply.User.username}`}{" "}
                                      :
                                    </strong>{" "}
                                    {reply.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="reply-container">
                            <textarea
                              value={replyInputs[chat.id] || ""}
                              onChange={(e) =>
                                handleReplyChange(chat.id, e.target.value)
                              }
                              placeholder="Envoyer un message..."
                            />
                            <button onClick={() => handleSendReply(chat.id)}>
                              Envoyer
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === "userChats" && (
          <div>
            <h2>Mes messages</h2>
            {userChatsLoading ? (
              <p>Chargement des messages...</p>
            ) : userChats.length === 0 ? (
              <p>Vous n'avez pas discuté pour le moment.</p>
            ) : (
              <div>
                {userChats.map((chatGroup) => {
                  return (
                    <div key={chatGroup.eventId} className="chat-item">
                      <h4>Événement : {chatGroup.eventTitle}</h4>
                      {chatGroup.chats
                        .filter(
                          (chat) => chat.userId.toString() === userId.toString()
                        )
                        .map((chat) => (
                          <div key={chat.id} className="question-item">
                            <p>
                              <strong>
                                {chat.userId.toString() === userId.toString()
                                  ? "Vous"
                                  : `${chat.User.username}`}{" "}
                                :
                              </strong>{" "}
                              {chat.content}
                            </p>

                            {chat.response && chat.response.length > 0 ? (
                              <div className="responses">
                                {chat.response.map((reply) => (
                                  <div key={reply.id} className="response-item">
                                    <p>
                                      <strong>
                                        {reply.userId === userId
                                          ? "Vous"
                                          : `${reply.User.username}`}{" "}
                                        :
                                      </strong>{" "}
                                      {reply.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p></p>
                            )}
                          </div>
                        ))}

                      <div className="reply-container">
                        <textarea
                          value={replyInputs[chatGroup.eventId] || ""}
                          onChange={(e) =>
                            handleReplyChange(chatGroup.eventId, e.target.value)
                          }
                          placeholder="Envoyer un message..."
                        />
                        <button
                          onClick={() => handleSendReply(chatGroup.eventId)}
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <ToastContainer />
      </div>
    </div>
  );
};

export default Chat;
