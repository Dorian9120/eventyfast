import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/EventForm.css";

const CreateEventForm = ({ userId, onAddEvent }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [location, setLocation] = useState("");
  const [organizers, setOrganizers] = useState("");
  const [nombreMaxParticipants, setNombreMaxParticipants] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("");
  const [category, setCategory] = useState([
    { id: 1, name: "Concert" },
    { id: 2, name: "Festival" },
    { id: 3, name: "Spectacle" },
    { id: 4, name: "Sport" },
    { id: 5, name: "Conférence" },
    { id: 6, name: "Atelier" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const mapRef = useRef(null);
  const geocoder = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    const fetchGoogleMapsApiKey = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/events/key"
        );
        const { googleMapsApiKey } = response.data;
        if (googleMapsApiKey) {
          setGoogleMapsApiKey(googleMapsApiKey);
        } else {
          console.error("Aucune clé API retournée.");
          setError("La clé API Google Maps est manquante.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la clé API:", error);
        setError("Impossible de récupérer la clé API.");
      }
    };

    fetchGoogleMapsApiKey();
  }, []);

  const initMap = () => {
    if (
      googleMapsApiKey &&
      window.google &&
      window.google.maps &&
      mapRef.current
    ) {
      const defaultLatLng = { lat: 48.8566, lng: 2.3522 };

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: defaultLatLng,
      });

      markerInstance.current = new window.google.maps.Marker({
        map: mapInstance.current,
        position: defaultLatLng,
        draggable: true,
      });

      geocoder.current = new window.google.maps.Geocoder();

      window.google.maps.event.addListener(
        markerInstance.current,
        "dragend",
        () => {
          const newLatLng = markerInstance.current.getPosition();
          const newLat = newLatLng.lat();
          const newLng = newLatLng.lng();

          const newLocation = new window.google.maps.LatLng(newLat, newLng);
          geocoder.current.geocode(
            { location: newLocation },
            (results, status) => {
              if (status === "OK" && results[0]) {
                setLocation(results[0].formatted_address);
              } else {
                console.log("Lieu non trouvé après déplacement.");
                setLocation("Lieu non trouvé");
              }
            }
          );
        }
      );
    }
  };

  useEffect(() => {
    const loadGoogleMapsScript = (key) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    if (googleMapsApiKey) {
      window.initMap = initMap;
      loadGoogleMapsScript(googleMapsApiKey);
    }
  }, [googleMapsApiKey]);

  const handleSearchLocation = (address) => {
    if (!address) {
      setError("Entrer une adresse valide.");
      return;
    }
    if (geocoder.current) {
      geocoder.current.geocode({ address: address }, (results, status) => {
        if (status === "OK" && results[0]) {
          const latLng = results[0].geometry.location;
          const lat = latLng.lat();
          const lng = latLng.lng();
          setLocation(results[0].formatted_address);

          if (mapInstance.current && markerInstance.current) {
            mapInstance.current.setCenter({ lat, lng });
            markerInstance.current.setPosition({ lat, lng });

            mapInstance.current.panTo({ lat, lng });
          }

          console.log("Lieu : ", address);
        } else {
          console.error("Lieu non trouvé pour l'adresse: ", address);
          setLocation("Lieu non trouvé");
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Début de la soumission du formulaire");

    if (
      !title ||
      !description ||
      !selectedCategory ||
      !date ||
      !hours ||
      !location ||
      !organizers ||
      !nombreMaxParticipants
    ) {
      console.error("Erreur de validation : Tous les champs sont requis.");
      setError("Tous les champs sont requis.");
      return;
    }

    if (isNaN(nombreMaxParticipants) || nombreMaxParticipants <= 0) {
      console.error(
        "Erreur de validation : Le nombre maximum de participants doit être un nombre positif."
      );
      setError(
        "Le nombre maximum de participants doit être un nombre positif."
      );
      return;
    }

    const dateParts = date.split("-");
    const [year, month, day] = dateParts;

    const formattedDate = `${day}/${month}/${year}`;

    const formattedHours = hours || "00:00";

    setLoading(true);
    setError(null);

    const eventData = {
      title,
      description,
      date: formattedDate,
      hours: formattedHours,
      location,
      organizers,
      nombreMaxParticipants,
      userId,
      categoryId: selectedCategory,
    };

    try {
      const response = await axios.post(
        "http://localhost:3000/api/events",
        eventData
      );

      toast.success("Événement créé avec succès !");
      onAddEvent(response.data.event);

      setTitle("");
      setDescription("");
      setDate("");
      setHours("");
      setLocation("");
      setOrganizers("");
      setNombreMaxParticipants("");
      setSelectedCategory("");
      const scrollToTopElement = document.getElementById("root");
      if (scrollToTopElement) {
        scrollToTopElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      if (error.response) {
        if (error.response.data) {
          const errorMessage = error.response.data.message;
          setError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-form">
      <h2>Créer un nouvel événement</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="category-container">
          <label className="category-label">Catégorie</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
            className="category-select"
          >
            <option value="">Choisir une catégorie</option>
            {category.map((category) => (
              <option
                key={category.id}
                value={category.id}
                className="category-option"
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Heure</label>
          <input
            type="time"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Lieu / Adresse</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="Rentrer un lieu ou une adresse..."
          />
          <button
            type="button"
            className="map-button"
            onClick={() => handleSearchLocation(location)}
          >
            Rechercher
          </button>
          <div
            ref={mapRef}
            style={{ width: "100%", height: "300px", marginBottom: "10px" }}
          ></div>
        </div>
        <div>
          <label>Organisateurs</label>
          <input
            type="text"
            value={organizers}
            onChange={(e) => setOrganizers(e.target.value)}
            required
            placeholder="Nom de(s) organisateur(s)"
          />
        </div>
        <div>
          <label>Nombre Max de Participants</label>
          <input
            type="number"
            value={nombreMaxParticipants}
            onChange={(e) => setNombreMaxParticipants(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer l'événement"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
};

export default CreateEventForm;
