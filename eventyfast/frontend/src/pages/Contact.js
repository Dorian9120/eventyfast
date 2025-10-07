import React, { useState } from "react";
import axios from "axios";
import "../styles/Contact.css";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

const Contact = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    subject: "",
    message: "",
  });

  const [responseMessage, setResponseMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Reset error for the specific field when the user starts typing
    setErrors({
      ...errors,
      [name]: "",
    });
  };

  const validateForm = () => {
    const { username, email, subject, message } = formData;
    let formIsValid = true;
    let errors = {};

    if (!email) {
      errors.email = "L'email est requis";
      formIsValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "L'email n'est pas valide";
      formIsValid = false;
    }

    setErrors(errors);
    return formIsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { username, email, subject, message } = formData;

    if (!username || !email || !subject || !message) {
      setResponseMessage("Veuillez remplir tous les champs.");
      setIsError(true);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/contact",
        {
          username,
          email,
          subject,
          message,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setResponseMessage(
          t(
            "Merci, {{username}}. Votre message a bien été envoyé ! Nous vous répondrons sous peu.",
            { username }
          )
        );
        setIsError(false);
      } else {
        setResponseMessage(
          response.data.message ||
            "Une erreur est survenue. Veuillez réessayer."
        );
        setIsError(true);
      }
    } catch (err) {
      console.error("Erreur lors de la soumission du formulaire:", err);
      if (err.response) {
        setResponseMessage(
          err.response.data.message ||
            "Une erreur est survenue. Veuillez réessayer."
        );
      } else {
        setResponseMessage("Une erreur est survenue. Veuillez réessayer.");
      }
      setIsError(true);
    }
    setLoading(false);

    setFormData({
      username: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="contact-form-container">
      <h2>{t("Contactez-nous")}</h2>
      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group-contact">
          <label htmlFor="username">{t("Nom d'utilisateur")}</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder={t("Votre nom d'utilisateur")}
            required
          />
          {errors.username && (
            <p className="error-message">{errors.username}</p>
          )}
        </div>

        <div className="form-group-contact">
          <label htmlFor="email">{"Email"}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={"Email"}
            required
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        <div className="form-group-contact">
          <label htmlFor="subject">{t("Sujet")}</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder={t("Le sujet de votre message")}
            required
          />
          {errors.subject && <p className="error-message">{errors.subject}</p>}
        </div>

        <div className="form-group-contact">
          <label htmlFor="message">{t("Message")}</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder={t("Votre message")}
            required
          />
          {errors.message && <p className="error-message">{errors.message}</p>}
        </div>

        <button type="submit">
          {loading ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader2
                className="loader-icon"
                size={20}
                style={{
                  marginRight: "8px",
                  animation: "spin 1s linear infinite",
                }}
              />
              {t("Chargement...")}
            </span>
          ) : (
            t("Envoyer")
          )}
        </button>
      </form>

      {responseMessage && (
        <div className={`response-message ${isError ? "error" : "success"}`}>
          {responseMessage}
        </div>
      )}
    </div>
  );
};

export default Contact;
