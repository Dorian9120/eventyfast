import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./pages/About";
import Chat from "./pages/Chat";
import ChatEvent from "./pages/ChatEvent";
import Contact from "./pages/Contact";
import EventParticipation from "./pages/EventParticipation";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import EditEvents from "./components/EditEvents";
import FavoritesAds from "./pages/FavoritesAds";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyAds from "./pages/MyAds";
import ProfilePage from "./pages/ProfilePage";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import Notifs from "./pages/Notifs";
import Users from "./pages/Users";
import EditUsers from "./pages/EditUsers";
import ScrollToTop from "./components/ScrollToTop";
import EventParticipant from "./pages/EventParticipant";

const App = () => {
  const [favorites, setFavorites] = useState([]);
  const [searchEvent, setSearchEvent] = useState("");

  return (
    <Router>
      <ScrollToTop />
      <Header searchEvent={searchEvent} setSearchEvent={setSearchEvent} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/events"
          element={
            <Events
              favorites={favorites}
              setFavorites={setFavorites}
              searchEvent={searchEvent}
              setSearchEvent={setSearchEvent}
            />
          }
        />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-ads" element={<MyAds />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/event-details/:eventId" element={<EventDetails />} />
        <Route path="/events/:id/edit" element={<EditEvents />} />
        <Route path="/edit-user/:userId" element={<EditUsers />} />
        <Route
          path="/favorites-ads"
          element={<FavoritesAds favorites={favorites || []} />}
        />
        <Route path="/event-participation" element={<EventParticipation />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat-event/:eventId" element={<ChatEvent />} />
        <Route path="/notifs" element={<Notifs />} />
        <Route path="/users" element={<Users />} />
        <Route
          path="/event-participant/:eventId"
          element={<EventParticipant />}
        />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
