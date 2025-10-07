import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Rgpd from "../components/rgpd";
import "../styles/Footer.css";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const [isRgpdOpen, setIsRgpdOpen] = useState(false);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [location]);

  const openRgpdModal = () => {
    setIsRgpdOpen(true);
  };

  const closeRgpdModal = () => {
    setIsRgpdOpen(false);
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="p-footer">{t("footerText")}</p>
        <nav className="footer-nav">
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            {t("about")}
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            {t("contact")}
          </NavLink>
          <NavLink onClick={openRgpdModal} data-no-scroll="true">
            {t("terms")}
          </NavLink>
          {isRgpdOpen && <Rgpd onClose={closeRgpdModal} />}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
