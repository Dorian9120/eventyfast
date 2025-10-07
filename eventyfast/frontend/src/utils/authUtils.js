import axios from "axios";

export const updateLastLogin = async () => {
  const currentDate = new Date().toISOString();
  localStorage.setItem("lastLogin", currentDate);

  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("❌ ID utilisateur non trouvé");
      throw new Error("ID utilisateur non trouvé");
    }

    const requestData = {
      userId,
      loginTime: currentDate,
      ipAddress: "",
      device: "",
    };

    console.log("📡 Envoi de l'historique de connexion:", requestData);

    const response = await axios.post(
      `http://localhost:3000/api/users/history/${userId}`,
      requestData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Historique de connexion ajouté", response.data);
  } catch (error) {
    console.error("❌ Erreur lors de la requête", error);
  }
};
