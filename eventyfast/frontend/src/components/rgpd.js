import React from "react";
import "../styles/Rgpd.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Rgpd = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{t("Politique de Confidentialité")}</h2>
        <p>
          <strong>{t("Dernière mise à jour")}:</strong> [06/03/2025]
        </p>

        <h3>1. {t("Informations générales")}</h3>
        <p>{t("intro")}</p>

        <h3>2. {t("Responsable du traitement")}</h3>
        <p>
          <strong>{t("Nom de l'entreprise")}:</strong> EventyFast
        </p>
        <p>
          <strong>{t("Email de contact")}:</strong> noreply.eventyfast@gmail.com
        </p>

        <h3>3. {t("Données collectées")}</h3>
        <p>{t("Nous collectons les données suivantes")}:</p>
        <ul>
          <li>{t("Nom d'utilisateur")}</li>
          <li>{t("Email")}</li>
          <li>{t("Numéro de téléphone")}</li>
        </ul>

        <h3>4. {t("Finalités du traitement")}</h3>
        <p>{t("Nous collectons ces données afin de")}:</p>
        <ul>
          <li>{t("création et gestion des comptes")}</li>
          <li>{t("communication utilisateurs")}</li>
          <li>{t("sécurité des comptes")}</li>
        </ul>

        <h3>5. {t("Base légale du traitement")}</h3>
        <p>{t("Le traitement des données repose sur")}:</p>
        <ul>
          <li>{t("exécution contrat")}</li>
          <li>{t("intérêt légitime")}</li>
        </ul>

        <h3>6. {t("Durée de conservation des données")}</h3>
        <p>{t("conservation des données")}</p>

        <h3>7. {t("Partage des données")}</h3>
        <p>{t("pas de partage")}</p>

        <h3>8. {t("Droits des utilisateurs")}</h3>
        <p>{t("Conformément au RGPD")}</p>
        <ul>
          <li>
            <strong>{t("Accès")}:</strong>{" "}
            {t("Obtenir une copie de vos données personnelles")}
          </li>
          <li>
            <strong>{t("Rectification")}:</strong>{" "}
            {t("Modifier des informations inexactes ou incomplètes")}
          </li>
          <li>
            <strong>{t("Suppression")}:</strong>{" "}
            {t("Demander la suppression de vos données")}
          </li>
          <li>
            <strong>{t("Portabilité")}:</strong>{" "}
            {t("Recevoir vos données dans un format structuré")}
          </li>
          <li>
            <strong>{t("Opposition")}:</strong>{" "}
            {t("S'opposer au traitement de vos données")}
          </li>
        </ul>

        <p>{t("exercer ces droits")}</p>
        <ul>
          <li>{t("formulaire de contact")}</li>
          <li>{t("modification profil")}</li>
        </ul>

        <h3>9. {t("Sécurité des données")}</h3>
        <p>{t("Nous mettons en place des mesures")}</p>
        <ul>
          <li>{t("Hashage des mots de passe")}</li>
          <li>{t("Authentification 2FA")}</li>
          <li>{t("Envoi d’emails de confirmation")}</li>
        </ul>

        <h3>10. {t("Hébergement des données")}</h3>
        <p>{t("Les données sont stockées")}</p>

        <h3>11. {t("Contact")}</h3>
        <p>
          {t("Pour toute question")}{" "}
          <Link
            to={"/contact"}
            style={{ color: "#007bff" }}
            className="rgpd-contact-link"
            onClick={onClose}
          >
            {t("Contact")}
          </Link>
        </p>

        <p>{t("modification politique")}</p>

        <button className="close-button" onClick={onClose}>
          {t("Fermer")}
        </button>
      </div>
    </div>
  );
};

export default Rgpd;
