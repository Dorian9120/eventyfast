const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  let token = req.cookies?.authToken;

  if (!token) {
    return res
      .status(403)
      .json({ message: "Accès interdit. Veuillez fournir un token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Session expirée, veuillez vous reconnecter." });
    }
    console.error("Erreur de vérification du token:", err);
    return res.status(400).json({ message: "Token invalide ou expiré." });
  }
};

const generateToken = (user) => {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "3h" }
  );
  return token;
};

module.exports = { verifyToken, generateToken };
