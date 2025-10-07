import React from "react";
import "../styles/About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <h2>
          À propos de <span>EventyFast</span>
        </h2>
        <p>
          EventyFast est une plateforme innovante qui permet de créer, gérer et
          participer à des événements en toute simplicité. Notre mission est de
          connecter les passionnés d’événements et de faciliter l'organisation
          de rencontres mémorables.
        </p>

        <div className="about-features">
          <div className="feature">
            <i className="fas fa-calendar-check"></i>
            <h3>Création d'événements</h3>
            <p>
              Créez facilement vos propres événements et partagez-les avec la
              communauté.
            </p>
          </div>

          <div className="feature">
            <i className="fas fa-users"></i>
            <h3>Participation simplifiée</h3>
            <p>
              Rejoignez des événements en un clic et connectez-vous avec
              d'autres participants.
            </p>
          </div>

          <div className="feature">
            <i className="fas fa-comments"></i>
            <h3>Interaction en temps réel</h3>
            <p>
              Discutez et échangez avec les autres membres via notre espace de
              discussion.
            </p>
          </div>
        </div>

        <p className="about-end">
          Rejoignez-nous dès aujourd'hui et faites partie d'une communauté
          dynamique et passionnée !
        </p>
      </div>
    </div>
  );
};

export default About;
