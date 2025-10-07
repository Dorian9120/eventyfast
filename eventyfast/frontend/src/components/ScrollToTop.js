import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    const scrollToTopElement = document.getElementById("root");
    if (scrollToTopElement) {
      scrollToTopElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location]);

  return null;
};

export default ScrollToTop;
