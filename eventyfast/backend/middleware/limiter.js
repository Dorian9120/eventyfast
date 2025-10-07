const rateLimit = require("express-rate-limit");

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Trop de tentatives, réessayer plus tard.",
  standardHeaders: false,
  legacyHeaders: false,
});

// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: "Trop de tentatives, réessayer plus tard !!!!!!",
//   standardHeaders: false,
//   legacyHeaders: false,
// });

module.exports = { registerLimiter };
