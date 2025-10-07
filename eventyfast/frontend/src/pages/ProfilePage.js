import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/Profile.css";

const ProfilePage = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    dateOfBirth: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState(false);
  const [isUsernameEditing, setIsUsernameEditing] = useState(false);
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/profile", {
          withCredentials: true,
        });

        setUser({
          username: response.data.username,
          email: response.data.email,
          phone: response.data.phone,
          dateOfBirth: response.data.dateOfBirth,
        });

        setIs2faEnabled(response.data.isTwoFactorEnabled || false);
      } catch (err) {
        toast.error(
          "Impossible de charger les informations de l'utilisateur. Veuillez vous reconnecter !"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleVerify2FA = async () => {
    if (!twoFactorCode.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        twoFactorCode: "Veuillez entrer un code 2FA.",
      }));
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/verify-2fa-action",
        {
          userId: localStorage.getItem("userId"),
          token: twoFactorCode,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        setIsTwoFactorVerified(true);
        setErrors((prevErrors) => ({ ...prevErrors, twoFactorCode: "" }));
      }
    } catch (err) {
      console.error("Erreur de vérification 2FA:", err);

      setErrors((prevErrors) => ({
        ...prevErrors,
        twoFactorCode: "Le code 2FA est incorrect. Réessayez.",
      }));
    }
  };

  const validateForm = async () => {
    let isValid = true;
    let fieldErrors = { ...errors };
    let validationErrors = {};

    if (!user.username) {
      fieldErrors.username = "Le nom d'utilisateur est requis.";
      isValid = false;
    } else {
      fieldErrors.username = "";
    }

    if (!user.email) {
      fieldErrors.email = "L'email est requis.";
      isValid = false;
    } else {
      fieldErrors.email = "";
    }

    if (isPasswordEditing) {
      if (!oldPassword) {
        validationErrors.oldPassword = "Ancien mot de passe requis.";
        isValid = false;
      } else {
        validationErrors.oldPassword = "";
      }

      const isOldPasswordCorrect = await verifyOldPassword(oldPassword);

      if (!isOldPasswordCorrect) {
        validationErrors.oldPassword = "L'ancien mot de passe est incorrect.";
        isValid = false;
      } else {
        validationErrors.oldPassword = "";
      }

      if (newPassword !== confirmPassword) {
        validationErrors.confirmPassword =
          "Les mots de passe ne correspondent pas.";
        isValid = false;
      } else {
        validationErrors.newPassword = "";
        validationErrors.confirmPassword = "";
      }

      if (is2faEnabled && !twoFactorCode) {
        validationErrors.twoFactorCode =
          "Le code de vérification 2FA est requis.";
        isValid = false;
      } else {
        validationErrors.twoFactorCode = "";
      }
    }

    const combinedErrors = { ...fieldErrors, ...validationErrors };

    setErrors(combinedErrors);
    console.log("Validation du formulaire terminée: isValid =", isValid);

    if (isValid) {
    }

    return isValid;
  };

  const verifyOldPassword = async (oldPassword) => {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/users/${userId}/verify-password`,
        { oldPassword: oldPassword },
        { withCredentials: true }
      );

      if (response.data.valid) {
        return true;
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          oldPassword: "L'ancien mot de passe est incorrect.",
        }));
        return false;
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          oldPassword: "L'ancien mot de passe est incorrect.",
        }));
      }
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Formulaire soumis !");

    // Validation du formulaire
    if (!(await validateForm())) {
      console.log("Formulaire invalide, la soumission est arrêtée");
      return;
    }

    try {
      const updateResults = [];

      // 1️⃣ Mise à jour du nom d'utilisateur (si modifié)
      if (isUsernameEditing) {
        try {
          setLoading(true);
          const usernameResponse = await axios.put(
            `http://localhost:3000/api/users/${userId}/username`,
            { username: user.username },
            {
              withCredentials: true,
            }
          );

          if (usernameResponse.data && usernameResponse.data.user) {
            setUser((prevUser) => ({
              ...prevUser,
              username: usernameResponse.data.user.username,
            }));
            updateResults.push({ field: "username", success: true });
            // toast.success("Nom d'utilisateur mis à jour avec succès.");
            setSuccessMessage("Nom d'utilisateur mis à jour avec succès.");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            throw new Error("Erreur de réponse du serveur");
          }
        } catch (err) {
          console.error(
            "Erreur lors de la mise à jour du nom d'utilisateur:",
            err
          );
          setErrors((prevErrors) => ({
            ...prevErrors,
            username:
              err.response?.data?.message ||
              "Erreur lors de la mise à jour du nom d'utilisateur.",
          }));
          updateResults.push({
            field: "username",
            success: false,
            error: err.message,
          });
        } finally {
          setLoading(false);
        }
      }

      // 2️⃣ Mise à jour de l'email (si modifié)
      if (isEmailEditing) {
        try {
          const emailResponse = await axios.put(
            `http://localhost:3000/api/users/${userId}/email`,
            { email: user.email },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          updateResults.push({ field: "email", success: true });
          toast.success("Email mis à jour avec succès.");
        } catch (err) {
          console.error("Erreur lors de la mise à jour de l'email:", err);
          setErrors((prevErrors) => ({
            ...prevErrors,
            email:
              err.response?.data?.message ||
              "Erreur lors de la mise à jour de l'email.",
          }));
          updateResults.push({
            field: "email",
            success: false,
            error: err.message,
          });
        }
      }

      // 3️⃣ Mise à jour du mot de passe
      if (isPasswordEditing) {
        if (is2faEnabled) {
          if (isTwoFactorVerified) {
            console.log(
              "Tentative d'envoi de la requête API pour changer le mot de passe..."
            );
            try {
              setLoading(true);
              const passwordResponse = await axios.put(
                `http://localhost:3000/api/users/${userId}/password`,
                { oldPassword: oldPassword, newPassword: newPassword },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              updateResults.push({ field: "password", success: true });
              setSuccessMessage("Mot de passe mis à jour avec succès.");
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (err) {
              console.error(
                "Erreur lors de la mise à jour du mot de passe:",
                err
              );

              if (err.response) {
                const errorMessage =
                  err.response?.data?.message ||
                  "Erreur lors de la mise à jour du mot de passe.";

                updateResults.push({
                  field: "password",
                  success: false,
                  error: errorMessage,
                });
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  oldPassword: errorMessage,
                }));
              } else {
                console.error("Erreur inconnue:", err);
              }
            } finally {
              setLoading(false);
            }
          }
        }
      }
    } catch (err) {
      console.error("Erreur lors de la soumission du formulaire:", err);
      setError(
        "Une erreur s'est produite lors de la mise à jour des informations."
      );
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
    );
    if (confirmDelete) {
      toast.success("Votre compte est en cours de suppression.");

      try {
        const userId = localStorage.getItem("userId");

        await axios.delete(`http://localhost:3000/api/users/${userId}`, {
          withCredentials: true,
        });

        localStorage.clear();
        setProfileMenuOpen(false);

        setTimeout(() => {
          navigate("/");
          window.location.reload();
        }, 2000);
      } catch (err) {
        setErrors("Erreur lors de la suppression du compte.");
        toast.error("Erreur lors de la suppression du compte.");
        console.error(err);
      }
    }
  };

  const handlePasswordChangeClick = () => {
    setIsPasswordEditing(!isPasswordEditing);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // if (loading) return <p></p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="profile-container">
      <h2 className="profile-title">Mon Profil 👤</h2>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur :</label>
          <input
            type="text"
            id="username"
            name="username"
            value={user.username}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
            onFocus={() => setIsUsernameEditing(true)}
            required
            className="input-field"
          />
          {errors.username && (
            <div className="error-message">{errors.username}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email :</label>
          <input
            type="email"
            id="email"
            name="email"
            value={user.email}
            // onChange={(e) => setUser({ ...user, email: e.target.value })}
            onFocus={() => setIsEmailEditing(true)}
            required
            className="input-field-email"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Numéro de téléphone :</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={user.phone}
            // onChange={(e) => setUser({ ...user, phone: e.target.value })}
            required
            className="input-field-phone"
            style={{ cursor: "default" }}
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="dateOfbirth">Date de naissance :</label>
          <input
            type="date"
            id="dateOfbirth"
            name="dateOfbirth"
            value={user.dateOfBirth}
            required
            className="input-field-dateOfBirth"
          />
        </div>

        <div className="form-group">
          <label
            htmlFor="password"
            className="password-label"
            onClick={handlePasswordChangeClick}
          >
            Mot de passe
          </label>

          {isPasswordEditing && (
            <>
              {is2faEnabled && !isTwoFactorVerified ? (
                <div className="form-group">
                  <label style={{ marginTop: "10px" }} htmlFor="twoFactorCode">
                    Veuillez entrer un code 2FA généré grâce à l'application
                    Google Authenticator :
                  </label>
                  <input
                    type="text"
                    id="twoFactorCode"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    required
                    className="input-field"
                  />
                  {errors.twoFactorCode && (
                    <div className="error-message">{errors.twoFactorCode}</div>
                  )}
                  <button
                    type="button"
                    onClick={handleVerify2FA}
                    className="verify-button-profile"
                  >
                    Vérifier le code 2FA
                  </button>
                </div>
              ) : (
                console.log(
                  "Champ 2FA non affiché - is2faEnabled:",
                  is2faEnabled,
                  "isTwoFactorVerified:",
                  isTwoFactorVerified
                )
              )}

              {(!is2faEnabled || isTwoFactorVerified) && (
                <div>
                  <div className="form-group">
                    <label htmlFor="oldPassword" style={{ marginTop: "10px" }}>
                      Ancien mot de passe :
                    </label>
                    <input
                      type="password"
                      id="oldPassword"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="input-field"
                    />
                    {errors.oldPassword && (
                      <div className="error-message">{errors.oldPassword}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">Nouveau mot de passe :</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="input-field"
                    />
                    {errors.newPassword && (
                      <div className="error-message">{errors.newPassword}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      Confirmer le mot de passe :
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="input-field"
                    />
                    {errors.confirmPassword && (
                      <div className="error-message">
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                  {successMessage && (
                    <div className="success-message-edit-event">
                      {successMessage}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="buttons">
          <button type="submit" className="submit-button">
            {loading ? "Changement en cours..." : "Mettre à jour"}
          </button>
          <button onClick={handleDeleteAccount} className="delete-button">
            Supprimer mon compte
          </button>
        </div>
      </form>

      <ToastContainer />
    </div>
  );
};

export default ProfilePage;
