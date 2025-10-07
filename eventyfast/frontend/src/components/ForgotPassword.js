import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/ForgetPassword.css";
import { FaArrowDownLong } from "react-icons/fa6";
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

const ForgotPassword = ({ onClose }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const validatePasswordFront = (password) => {
    let errors = [];

    if (password.length < 6) {
      errors.push("Le mot de passe doit contenir au moins 6 caractères.");
    }
    if (!/[A-Za-z]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins une lettre.");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins un chiffre.");
    }

    setPasswordErrors(errors);
    setIsPasswordValid(errors.length === 0);
  };

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "Enter" && index === code.length - 1) {
      handleVerifyCode();
    }
  };

  const handleRequestReset = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/reset-password",
        { email }
      );
      setMessage(response.data.message);
      setError("");
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'envoi du code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    const fullCode = code.map((c) => c || "").join("");
    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/verify-password-code",
        { email, code: fullCode, newPassword }
      );

      setMessage(response.data.message);
      setError("");
      setStep(3);
    } catch (err) {
      console.log("Erreur du serveur:", err.response?.data);
      setError(
        err.response?.data?.message || "Erreur lors de la vérification du code."
      );
    } finally {
      setLoading(false);
    }
  };

  const goBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else onClose();
  };

  return (
    <div className="forgot-modal">
      <div className="forgot-content">
        <div className="modal-header">
          {step !== 3 && (
            <FaArrowLeft className="close-icon" onClick={goBackStep} />
          )}
        </div>
        <h3>Réinitialisation du mot de passe</h3>

        {step === 1 && (
          <div className="forgot-input">
            <label>Email :</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRequestReset()}
              required
            />
            <button onClick={handleRequestReset}>
              {loading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  {t("Chargement")}
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
                t("Envoyer")
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="forgot-input">
            <label style={{ marginRight: "10px" }}>
              Nouveau mot de passe :
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
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
                <p className="success-message">
                  ✅ Toutes les conditions sont remplies.
                </p>
              )
            )}

            <p style={{ color: "#ddd" }}>
              Un code a été envoyé à votre email. Veuillez le saisir ci-dessous
              :
            </p>

            <div className="code-input-container">
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="code-input"
                />
              ))}
            </div>
            <button onClick={handleVerifyCode}>
              {loading ? "Vérification en cours..." : "Valider"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="success-message">
              ✅ Mot de passe réinitialisé avec succès ! Vous pouvez vous
              connecter.
            </p>
            <FaArrowDownLong className="arrow-icon-forgot" />
            <Link to="/login" className="login-link" onClick={onClose}>
              Connectez-vous
            </Link>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        {/* {message && <p className="message">{message}</p>} */}
      </div>
    </div>
  );
};

export default ForgotPassword;
