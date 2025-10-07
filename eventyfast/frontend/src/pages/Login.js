import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { updateLastLogin } from "../utils/authUtils";
import axios from "axios";
import ForgotPassword from "../components/ForgotPassword";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchGoogleClientId = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/google-clientid"
        );
        setGoogleClientId(response.data.googleClientId);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'ID client Google",
          error
        );
      }
    };

    fetchGoogleClientId();
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = async (response) => {
    setLoading(true);

    const token = response.credential;

    if (!token) {
      console.error("Token d'authentification Google manquant");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/validate-google-token",
        {
          token,
          formData,

          withCredentials: true,
        }
      );

      const data = response.data;
      console.log("Réponse du serveur:", data);

      console.log("Cookies après connexion :", document.cookie);
      setUser({
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        isTwoFactorVerified: data.user.isTwoFactorVerified,
        isTwoFactorEnabled: data.user.isTwoFactorEnabled,
      });

      setMessage(data.message);

      updateLastLogin();
      navigate("/");
    } catch (err) {
      console.error("Erreur lors de la validation du token", err);
      setLoading(false);
      setMessage("Erreur lors de la connexion avec Google");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/login",
        formData,
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      if (data.message === "Connexion réussie") {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem(
          "isTwoFactorVerified",
          data.user.isTwoFactorVerified
        );
        localStorage.setItem(
          "isTwoFactorEnabled",
          data.user.isTwoFactorEnabled
        );

        setMessage(data.message);
        updateLastLogin();
        navigate("/");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 429) {
          setMessage("Trop de tentatives, réessayer plus tard.");
        } else {
          setMessage(error.response.data.message || "Une erreur est survenue.");
        }
      } else if (error.request) {
        setMessage("Problème de connexion au serveur.");
      } else {
        setMessage("Erreur lors de la connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setIsForgotPasswordOpen(true);
  };

  const closeForgotPassword = () => {
    setIsForgotPasswordOpen(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
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
              onChange={onChange}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="forget-password-link"
          onClick={openForgotPassword}
        >
          {t("Mot de passe oublié")}
        </button>

        <button type="submit" className="login-button">
          {loading ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {t("Connexion en cours...")}
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
            t("Se connecter")
          )}
        </button>

        <p style={{ fontSize: "15px", textAlign: "center", color: "#555" }}>
          {t("Où connectez-vous avec google")}
        </p>

        <GoogleOAuthProvider clientId={googleClientId}>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={(error) => console.error("Erreur Google", error)}
            useOneTap
            theme="filled_black"
            shape="pill"
            text="continue_with"
            logo_alignment="center"
          />
        </GoogleOAuthProvider>

        <Link to="/register" className="register-link">
          {t("Pas de compte ? Créez-en un")}
        </Link>

        {message && <p className="err-message-login">{message}</p>}
      </form>

      {isForgotPasswordOpen && <ForgotPassword onClose={closeForgotPassword} />}
    </div>
  );
};

export default Login;
