import React, { useState, useRef } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/VerifEmail.css";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const VerificationEmail = ({
  email,
  username,
  password,
  phone,
  dateOfBirth,
  onClose,
  onVerify,
}) => {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fullCode = code.map((c) => c || "").join("");
    console.log({ email, password, code: fullCode });

    try {
      const response = await axios.post(
        "http://localhost:3000/api/register/verify-code",
        {
          email,
          code: fullCode,
          password,
          username,
          phone,
          dateOfBirth,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;

      if (response.status === 200) {
        onVerify();
        toast.success("Inscription validée !");
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorMessage =
          response.data.message || "Code de validation incorrect.";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la validation du code."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyTimeOut = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="verification-modal">
      <div className="modal-content">
        <div className="modal-header">
          <FaArrowLeft className="close-icon" onClick={onClose} />
        </div>
        <h3>Code de validation reçu par email</h3>

        <form onSubmit={handleSubmit}>
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
          <button type="submit" onClick={verifyTimeOut} disabled={loading}>
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                Vérification en cours
                <Loader2
                  className="loader-icon"
                  size={20}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              </span>
            ) : (
              "Vérifier"
            )}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default VerificationEmail;
