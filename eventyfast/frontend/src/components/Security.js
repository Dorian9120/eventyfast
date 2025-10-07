import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";
import "../styles/Security.css";

const SecuritySettings = () => {
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const stored2faStatus = localStorage.getItem("isTwoFactorEnabled");
    const isTwoFactorVerified = localStorage.getItem("isTwoFactorVerified");

    if (isTwoFactorVerified === "true") {
      setIsTwoFactorVerified(true);
    } else {
      setIsTwoFactorVerified(false);
    }

    if (stored2faStatus === "true") {
      setIs2faEnabled(true);
    } else {
      setIs2faEnabled(false);
    }
    console.log("isFactorVerified", isTwoFactorVerified);
  }, []);

  const handleToggle2fa = async () => {
    setIs2faEnabled(false);
    if (is2faEnabled) {
      try {
        await axios.post("http://localhost:3000/api/disable-2fa", { userId });

        setIs2faEnabled(false);
        setIsTwoFactorVerified(false);
        localStorage.setItem("isTwoFactorEnabled", "false");
        localStorage.setItem("isTwoFactorVerified", "false");
        setQrCodeUrl("");
        setVerificationStatus("2FA désactivée avec succès.");
      } catch (error) {
        console.error("Erreur lors de la désactivation de la 2FA :", error);
        setVerificationStatus("Erreur lors de la désactivation de la 2FA.");
      }
    } else {
      try {
        const response = await axios.post(
          "http://localhost:3000/api/enable-2fa",
          { userId }
        );
        setQrCodeUrl(response.data.otpauth_url);
        setIs2faEnabled(true);
        setVerificationStatus("2FA activée avec succès.");
        localStorage.setItem("isTwoFactorEnabled", "true");
      } catch (error) {
        console.error("Erreur lors de l’activation de la 2FA :", error);
        setVerificationStatus("Erreur lors de l’activation de la 2FA.");
      }
    }
  };

  const handleVerifyCode = async () => {
    setIsTwoFactorVerified(false);
    console.log("2faVerified avant:", isTwoFactorVerified);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/verify-2fa",
        { userId, token: verificationCode }
      );

      if (response.data.success) {
        localStorage.setItem("isTwoFactorVerified", "true");
        setVerificationStatus("Code 2FA vérifié avec succès !");
        setIsTwoFactorVerified(true);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setVerificationStatus("Erreur lors de la vérification du code.");
      }
    } catch (error) {
      setVerificationStatus(
        <p style={{ color: "red", fontSize: "16px", fontWeight: "600" }}>
          Code incorrect, réessayez.
        </p>
      );
    }
  };

  return (
    <div className="security-settings-container">
      <div className="security-settings">
        <h2>Sécurité du compte</h2>

        <div className="enable-2fa-checkbox">
          <input
            type="checkbox"
            checked={is2faEnabled}
            onChange={handleToggle2fa}
          />
          <label>Authentification à deux facteurs (2FA)</label>
        </div>

        {is2faEnabled && qrCodeUrl && (
          <div className="qr-code-container">
            <p>
              Scannez ce QR code avec une application comme Google Authenticator
              :
            </p>
            <QRCodeCanvas value={qrCodeUrl} />
            <p>
              Si vous ne pouvez pas scanner le QR code, utilisez cette clé :
            </p>
            <p className="secret-key">{qrCodeUrl.split("secret=")[1]}</p>
          </div>
        )}

        {is2faEnabled && !isTwoFactorVerified && (
          <div className="verify-2fa">
            <h4>Vérifier le code 2FA</h4>
            <input
              type="text"
              placeholder="Scannez le QR code et entrez un code 2FA"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />

            <button onClick={handleVerifyCode}>Vérifier</button>
            <p className="info-text-2fa">
              <span className="info-icon">ℹ️</span>
              Si vous ne voyez pas le QR code, essayez de désactiver et
              réactiver la 2FA pour le régénérer.
            </p>
          </div>
        )}
        {verificationStatus && (
          <div
            className={is2faEnabled ? "success-message" : "disabled-message"}
          >
            {verificationStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
