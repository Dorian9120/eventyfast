import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Register.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VerificationModal from "../components/VerificationEmail";
import Rgpd from "../components/rgpd";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isRgpdOpen, setIsRgpdOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    document.body.classList.add("register-page");

    return () => {
      document.body.classList.remove("register-page");
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".password-input")) {
        setIsPasswordValid(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
  });

  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const { username, email, password, confirmPassword, phone, dateOfBirth } =
    formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Une erreur est survenue");
        return;
      }

      setEmailToVerify(email);
      setIsModalOpen(true);
      setMessage("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du formulaire : ", error);
      toast.error("Une erreur est survenue, veuillez réessayer.");
      setMessage("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const onVerify = () => {
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  const validatePasswordFront = (password) => {
    let errors = [];
    setFormData({ ...formData, password: password });

    if (password.length < 6) {
      errors.push(t("Le mot de passe doit contenir au moins 6 caractères."));
    }
    if (!/[A-Za-z]/.test(password)) {
      errors.push(t("Le mot de passe doit contenir au moins une lettre."));
    }
    if (!/[0-9]/.test(password)) {
      errors.push(t("Le mot de passe doit contenir au moins un chiffre."));
    }

    setPasswordErrors(errors);
    setIsPasswordValid(errors.length === 0);
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t("Nom d'utilisateur")}</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">{t("Email")}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">{t("Mot de passe")}</label>
          <div className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => {
                validatePasswordFront(e.target.value);
              }}
              required
            />
            {passwordErrors.length > 0 ? (
              <ul className="error-list">
                {passwordErrors.map((err, index) => (
                  <li key={index} className="error">
                    {err}
                  </li>
                ))}
              </ul>
            ) : (
              isPasswordValid && (
                <p className="success-message" style={{ fontSize: "15px" }}>
                  ✅ {t("Toutes les conditions sont remplies.")}
                </p>
              )
            )}

            <button
              type="button"
              className="toggle-password"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">{t("ConfirmPassword")}</label>
          <div className="password-input">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
            />

            <button
              type="button"
              className="toggle-password"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phone">{t("Téléphone")}</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">{t("Date de naissance")}</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={dateOfBirth}
            onChange={onChange}
            required
            min="16"
          />
        </div>

        {message && <p className="error-message">{message}</p>}

        <div className="from group checkbox-terms">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            required
          />
          <label htmlFor="terms">
            {t("J'accepte les")}{" "}
            <span className="terms-link" onClick={() => setIsRgpdOpen(true)}>
              {t("conditions générales et la politique de confidentialité")}
            </span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="register-button">
          {loading ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {t("Création de votre compte")}
              <Loader2
                className="loader-icon"
                size={20}
                style={{
                  marginRight: "8px",
                  animation: "spin 1s linear infinite",
                }}
              />
            </span>
          ) : (
            t("Crée votre compte")
          )}
        </button>

        <Link to="/login" className="login-link">
          {t("Déjà un compte ? Connectez-vous")}
        </Link>
      </form>

      {isModalOpen && (
        <VerificationModal
          email={emailToVerify}
          username={username}
          password={password}
          phone={phone}
          dateOfBirth={dateOfBirth}
          onClose={closeModal}
          onVerify={onVerify}
        />
      )}
      {isRgpdOpen && <Rgpd onClose={() => setIsRgpdOpen(false)} />}
    </div>
  );
};

export default Register;
