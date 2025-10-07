require("dotenv").config();
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { User } = require("../models/");

const transporterEmail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (
  toEmail,
  formattedLoginTime,
  username,
  ipAddress,
  device
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Nouvelle connexion détectée",
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="text-align: center; color: #4CAF50;">Connexion détectée sur votre compte !</h2>
            <p>Bonjour <strong>${username}</strong>,</p>
            <p>Nous avons détecté une nouvelle connexion sur votre compte le <strong>${formattedLoginTime}</strong>.</p>
            <ul>
            <li>Votre compte : <strong>${toEmail}</strong></li>
            <li>Appareil : ${device}</li>
            <li>Adresse IP : ${ipAddress}</li>
            </ul>
            <p>Si vous êtes à l'origine de cette connexion, vous pouvez ignorer ce message.</p>
            <p>Si vous ne reconnaissez pas cette activité, nous vous recommandons de prendre les mesures suivantes :</p>
            <ul>
              <li>🔑 <strong><a href="" style="color: #ff5722;">Modifier votre mot de passe</a></strong></li>
              <li>⚙️ Vérifier vos paramètres de sécurité.</li>
              <li>📞 Si vous avez des questions, contactez notre support depuis notre site web</li>
            </ul>
            <p>Cordialement,</p>
            <p><strong>L'équipe EventyFast</strong></p>
          </div>
        </body>
      </html>
      `,
  };

  try {
    await transporterEmail.sendMail(mailOptions);
    console.log(
      `✅ Email envoyé à ${toEmail} pour ${username} (${formattedLoginTime})`
    );
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi de l'email :", err);
  }
};

const sendPasswordResetEmail = async (toEmail, username, resetTime) => {
  const date = new Date(resetTime);

  if (typeof resetTime === "string") {
    const [datePart, timePart] = resetTime.split(" ");
    const [day, month, year] = datePart.split("/");
    const formattedResetTime = `${year}-${month}-${day}T${timePart}`;

    resetTime = new Date(formattedResetTime);

    if (isNaN(resetTime)) {
      console.error("❌ resetTime est invalide:", formattedResetTime);
      return;
    }
  }

  const formattedResetTime = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(resetTime);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Changement de mot de passe détecté",
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="text-align: center; color: #FF9800;">Changement de mot de passe détecté sur votre compte !</h2>
            <p>Bonjour <strong>${username}</strong>,</p>
            <p>Nous avons détecté une mise à jour de votre mot de passe sur votre compte le <strong>${formattedResetTime}</strong>.</p>
            <p>Si vous êtes à l'origine de cette action, vous pouvez ignorer ce message.</p>
            <p>Si vous ne reconnaissez pas ce changement, nous vous recommandons de prendre les mesures suivantes :</p>
            <ul>
              <li>🔑 <strong><a href="" style="color: #ff5722;">Modifier immédiatement votre mot de passe</a></strong></li>
              <li>⚙️ Vérifier vos paramètres de sécurité.</li>
              <li>📞 Si vous avez des questions, contactez notre support depuis notre site web.</li>
            </ul>
            <p>Cordialement,</p>
            <p><strong>L'équipe EventyFast</strong></p>
          </div>
        </body>
      </html>
      `,
  };

  try {
    await transporterEmail.sendMail(mailOptions);
    console.log(
      `✅ Email envoyé à ${toEmail} pour ${username} (${formattedResetTime})`
    );
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi de l'email :", err);
  }
};

const sendContactEmail = async (toEmail, username, subject, message) => {
  const mailOptions = {
    from: toEmail,
    to: process.env.EMAIL_USER,
    subject: `Formulaire de contact: ${subject}`,
    html: `
        <html>
  <body style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f9; margin: 0; padding: 0;">
    <div style="text-align: center;">
              <img src="" alt="Logo EventyFast" style="width: 120px; height: auto;">
            </div>
      <h2 style="text-align: center; color: #4CAF50; font-size: 24px; margin-bottom: 15px;">Formulaire de contact soumis</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #555;">
        <strong>Nom :</strong> ${username}
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #555;">
        <strong>Email :</strong> ${toEmail}
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #555;">
        <strong>Sujet :</strong> ${subject}
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #555;">
        <strong>Message :</strong>
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #555; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
        ${message}
      </p>
      </div>
    </div>
  </body>
</html>

      `,
  };

  try {
    await transporterEmail.sendMail(mailOptions);
    console.log(
      `✅ Email envoyé au support de la part de ${toEmail} concernant le message ${subject}`
    );
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi de l'email de contact :", err);
  }
};

const sendConfirmationEmail = async (username, email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Confirmation de votre message - EventyFast",
      html: `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <div style="text-align: center;">
                <h2 style="color: #4CAF50;">Merci, ${username} !</h2>
                <p>Nous avons bien reçu votre message et nous y répondrons sous peu.</p>
                <p><strong>Sujet :</strong> ${subject}</p>
                <p><strong>Message :</strong></p>
                <p style="background-color: #f3f3f3; padding: 10px; border-radius: 5px;">${message}</p>
                <p>Nous vous contacterons dès que possible.</p>
                <br>
                <p>Cordialement,</p>
                <p><strong>L'équipe EventyFast</strong></p>
              </div>
            </body>
          </html>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email envoyé à ${email}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation :", error);
  }
};

const sendParticipationEmail = async (username, email, event, ticketCode) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Votre Ticket de Participation - EventyFast",
      html: `
      <html>
            <body>
        <div>
          <h2 style="padding: 10px; text-align: center; ">Votre Ticket de Participation</h2>
          <p>Bonjour <strong>${username}</strong>,</p>
          <p>Votre inscription à l'événement <strong>${
            event.title
          }</strong> a bien été enregistrée !</p>
          
          <h3>📅 Détails de l'événement :</h3>
          <ul>
            <li><strong>Date :</strong> ${new Date(
              event.date
            ).toLocaleDateString()}</li>
            <li><strong>Heure :</strong> ${event.hours}</li>
            <li><strong>Description :</strong> ${event.description}</li>
            <li><strong>Lieu :</strong> ${event.location}</li>
            <li><strong>Organisateur(s) :</strong> ${event.organizers}</li>
          </ul>

          <h3 style="color: #f39c12;">🎟️ Voici votre ticket :</h3>
          <p style="text-align: center; font-size: 18px; font-weight: bold; background: #f3f3f3; padding: 10px; border-radius: 5px; display: inline-block;">
            ${ticketCode}
          </p>

          <p style="margin-bottom: 10px;">Présentez ce ticket à l'entrée de l'événement.</p>

          <p><strong style="color: red;">❗ Rappel :</strong> Si vous ne pouvez plus participer, veuillez vous désinscrire pour libérer une place.</p>

          <p>Merci et à bientôt !</p>
          <p><strong>L'équipe EventyFast</strong></p>
        </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Ticket envoyé à ${email}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation :", error);
  }
};

const sendDeleteParticipationEmail = async (username, email, event) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Annulation de votre Participation - EventyFast",
      html: `
        <h3 style="text-align: center; color:red;">Annulation de votre participation reçu !</h3>
          <p>Bonjour ${username},</p>
          <p>Nous avons bien pris en compte votre annulation de participation à l'événement <strong>${
            event.title
          }</strong>.</p>
  
          <h3>Détails de l'événement :</h3>
          <ul>
            <li><strong>Date de l'événement :</strong> ${new Date(
              event.date
            ).toLocaleDateString()}</li>
            <li><strong>Description :</strong> ${event.description}</li>
            <li><strong>Lieu :</strong> ${event.location}</li>
            <li><strong>Organisateur(s) :</strong> ${event.organizers}</li>
          </ul>
  
          <p>Nous espérons que vous pourrez participer à un autre événement prochainement !</p>
  
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
  
          <p>Cordialement,<br>L'équipe EventyFast</p>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Annulation de participation : Email envoyé à ${email}`);
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email d'annulation de participation :",
      error
    );
  }
};

const generateValidationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailWithCode = async (email, generateValidationCode) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Votre code de validation est ${generateValidationCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h2>Bonjour,</h2>
          <p style="font-size: 14px; color: #555;">Nous avons reçu une demande de validation pour votre compte. Voici votre code :</p>
          <h3 style="font-size: 24px; font-weight: bold;">${generateValidationCode}</h3>
          <p style="font-size: 14px; color: #555;">Ce code est confidentiel et ne doit être partagé avec personne. Il est valable pour une durée limitée.</p>
          <p style="font-size: 14px; color: #555;">Si vous n'avez pas demandé ce code, veuillez ignorer cet e-mail.</p>
          <br/>
          <footer style="font-size: 12px; color: #777;">
            <p>Merci pour votre confiance.</p>
            <p>L'équipe EventyFast</p>
          </footer>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("📩 Code de validation envoyé a :", email);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
    throw new Error("Erreur lors de l'envoi de l'email");
  }
};

const sendEmailRappel = () => {
  console.log("🔔 Démarrage du cron pour envoyer les rappels...");
  async () => {
    console.log("🔔 Vérification des événements pour envoi de rappel...");

    try {
      const now = new Date();
      const reminderTimeStart = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const reminderTimeEnd = new Date(
        reminderTimeStart.getTime() + 60 * 60 * 1000
      );

      console.log(
        `📅 Cherche événements entre ${reminderTimeStart} et ${reminderTimeEnd}`
      );

      const events = await Event.findAll({
        where: {
          date: {
            [Op.between]: [reminderTimeStart, reminderTimeEnd],
          },
        },
      });

      if (events.length === 0) {
        console.log("❌ Aucun événement à notifier.");
        return;
      }

      for (const event of events) {
        const user = await User.findByPk(event.userId);

        if (user && user.email) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `🔔 Rappel : Événement "${event.title}" dans 72h`,
            text: `Bonjour ${
              user.username
            },\n\nNous avons bien enregistré votre inscription à "${
              event.title
            }".\nSi vous ne souhaitez plus participer, veuillez annuler votre inscription.\n\n📍 Lieu: ${
              event.location
            }\n📆 Date: ${event.date.toLocaleString()}\n\nCordialement,\nL'équipe`,
          };

          await transporter.sendMail(mailOptions);
          console.log(`✅ Email de rappel envoyé à ${user.email}`);
        } else {
          console.log(
            `⚠️ Impossible d'envoyer l'email : utilisateur introuvable ou email manquant pour l'ID ${event.userId}`
          );
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi des emails de rappel :", error);
    }
  };
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendContactEmail,
  sendConfirmationEmail,
  sendParticipationEmail,
  sendDeleteParticipationEmail,
  sendEmailWithCode,
  generateValidationCode,
  sendEmailRappel,
};
