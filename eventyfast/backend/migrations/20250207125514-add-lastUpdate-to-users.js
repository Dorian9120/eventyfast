'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'lastUpdate', {
      type: Sequelize.DATE,
      allowNull: true,  // Tu peux définir à false si tu veux que cette colonne soit obligatoire
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'lastUpdate');
  }
};
