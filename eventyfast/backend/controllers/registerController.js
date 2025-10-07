

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  
  const validatePassword = (password) => {
    if (password.length < 6) {
      return { isValid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { isValid: false, message: 'Le mot de passe doit contenir au moins une lettre' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    return { isValid: true };
  };


  
  



module.exports = { validateEmail, validatePassword }

