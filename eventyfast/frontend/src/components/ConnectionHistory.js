import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ConnectionHistory.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ConnectionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setError(
        "Impossible de récupérer l'historique sans identifiant utilisateur."
      );
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:3000/api/users/history/${userId}`, {
        withCredentials: true,
      })
      .then((response) => {
        if (response.data && Array.isArray(response.data.history)) {
          setHistory(response.data.history);
          console.log("Historique:", response.data.history);
        } else {
          setHistory([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Impossible de récupérer l'historique.");
        setLoading(false);
      });
  }, [userId]);

  const handleClearHistory = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/users/history/${userId}`, {
        withCredentials: true,
      });
      toast.success("Historique supprimé avec succès");
      setHistory([]);
      setError(null);
    } catch (err) {
      console.error(
        "Erreur API lors de la suppression de l'historique :",
        err.response || err.message
      );
    }
  };

  if (loading) {
    return <p>Chargement des données...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="connection-history-container">
      <h2 className="title">Historique des connexions</h2>

      {history.length === 0 ? (
        <p className="no-history-message">Aucun historique disponible.</p>
      ) : (
        <div>
          <div className="clear-history-button-container">
            <button
              onClick={handleClearHistory}
              className="clear-history-button"
            >
              Nettoyer l'historique
            </button>
          </div>
          <ul className="history-list">
            {history.map((connection, index) => (
              <li key={index} className="history-item">
                <div className="history-details">
                  <p>
                    <strong>Date :</strong>{" "}
                    {new Date(connection.loginTime).toLocaleString()}
                  </p>
                  <p>
                    <strong>IP :</strong> {connection.ipAddress || "Inconnue"}
                  </p>
                  <p>
                    <strong>Appareil :</strong>{" "}
                    {connection.device || "Non spécifié"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default ConnectionHistory;
