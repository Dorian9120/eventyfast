import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Users.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

const User = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/users", {
          withCredentials: true,
        });
        setUsers(response.data);
        setFilteredUsers(response.data);
        setTimeout(() => {
          setIsSimulatedLoading(false);
        }, 3000);
      } catch (err) {
        setError("Erreur lors de la récupération des utilisateurs.");
      } finally {
        setIsSimulatedLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const deleteUser = async (userId) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")
    ) {
      try {
        const response = await axios.delete(
          `http://localhost:3000/api/users/${userId}`,
          {
            withCredentials: true,
          }
        );
        const successMessage = response.data.message;
        toast.success(successMessage);
        window.location.reload(setTimeout(2000));
      } catch (err) {
        setError("Erreur lors de la suppression de l'utilisateur.");
      }
    }
  };

  const handleEdit = (userId) => {
    navigate(`/edit-user/${userId}`);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    const filtered = users.filter((user) => {
      return (
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.dateOfBirth?.toString().includes(query) ||
        user.phone.includes(query) ||
        user.role.toLowerCase().includes(query.toLowerCase())
      );
    });
    setFilteredUsers(filtered);
  };

  const formatDate = (date) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="users-container">
      <div className="users-list">
        <h2>{t("Liste des utilisateurs")}</h2>
        <input
          type="text"
          placeholder={t("Rechercher un utilisateur...")}
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-users"
        />
        {isSimulatedLoading ? (
          <div className="skeleton-container-users">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="skeleton-card-users">
                <div className="skeleton-table">
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>{t("Nom d'utilisateur")}</th>
                <th>Email</th>
                <th>{t("Date de naissance")}</th>
                <th>{t("Téléphone")}</th>
                <th>{t("Rôle")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const formattedDateOfBirth = formatDate(user.dateOfBirth);
                return (
                  <tr key={index}>
                    <td
                      style={{
                        background: "#667",
                        color: "white",
                        textAlign: "center",
                        borderRight: "2px solid #ddd",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{formattedDateOfBirth}</td>
                    <td>{user.phone}</td>
                    <td>{user.role}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(user.id)}
                        style={{ marginRight: "10px" }}
                      >
                        {t("Modifier")}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={{ backgroundColor: "red", color: "white" }}
                      >
                        {t("Supprimer")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default User;
