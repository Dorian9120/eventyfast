import { useState } from "react";
import Profile from "../pages/ProfilePage";
import ConnectionHistory from "../components/ConnectionHistory";
import Security from "../components/Security";
import "../styles/Settings.css";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile />;
      case "history":
        return <ConnectionHistory />;
      case "security":
        return <Security />;
      default:
        return <div>Sélectionnez un onglet.</div>;
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2 className="settings-title">Paramètres du compte</h2>
        <div className="tab-nav">
          <nav className="nav-buttons">
            <button
              className={`nav-button ${
                activeTab === "profile" ? "active-tab" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Gérer le profil
            </button>
            <button
              className={`nav-button ${
                activeTab === "history" ? "active-tab" : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              Historique des connexions
            </button>
            <button
              className={`nav-button ${
                activeTab === "security" ? "active-tab" : ""
              }`}
              onClick={() => setActiveTab("security")}
            >
              Sécurité
            </button>
          </nav>
        </div>
        <div className="tab-content">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default Settings;
