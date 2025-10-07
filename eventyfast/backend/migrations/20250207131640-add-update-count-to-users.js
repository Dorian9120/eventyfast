module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'updateCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,  // Valeur par défaut pour le compteur
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'updateCount');
  }
};
