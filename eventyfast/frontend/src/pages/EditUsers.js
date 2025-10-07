import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/EditUser.css";

const EditUser = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/users/${userId}`,
          {
            withCredentials: true,
          }
        );
        const { username, role } = response.data;
        console.log(response.data);
        setUsername(username);
        setRole(role);
      } catch (err) {
        console.error("Erreur lors du chargement de l'utilisateur :", err);
        setError("Impossible de récupérer les informations de l'utilisateur.");
      }
    };

    fetchUserDetails();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const updateData = {};
    if (username) updateData.username = username;
    if (role) updateData.role = role;

    try {
      const response = await axios.put(
        `http://localhost:3000/api/users/edit-user/${userId}`,
        updateData,
        {
          withCredentials: true,
        }
      );
      toast.success("Utilisateur mis à jour avec succès");
      setTimeout(() => {
        navigate("/users");
      }, 1500);
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-user-global-container">
      <div className="edit-user-container">
        <h2 className="edit-user-title">Modifier l'utilisateur : {username}</h2>

        <form onSubmit={handleSubmit} className="edit-user-form">
          <div>
            <label htmlFor="username" className="edit-user-label">
              Nom d'utilisateur :
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="edit-user-input"
            />
          </div>

          <div>
            <label htmlFor="role" className="edit-user-label">
              Rôle :
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="edit-user-select"
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="edit-user-button">
            {loading ? "Chargement..." : "Mettre à jour"}
          </button>
        </form>
        <ToastContainer className="edit-user-toast-container" />
      </div>
    </div>
  );
};

export default EditUser;
