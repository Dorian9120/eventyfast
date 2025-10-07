module.exports = (sequelize, DataTypes) => {
  const ConnectionHistory = sequelize.define(
    'ConnectionHistory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Nom de la table à laquelle on fait référence
          key: 'id',
        },
        onDelete: 'CASCADE', // Supprimer les connexions si l'utilisateur est supprimé
        onUpdate: 'CASCADE',
      },
      loginTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      device: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'connection_histories', // Nom explicite de la table dans la base de données
      timestamps: true, // Inclure createdAt et updatedAt automatiquement
    }
  );

  // Associations
  ConnectionHistory.associate = (models) => {
    ConnectionHistory.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user', // Alias pour accéder à l'utilisateur
    });
  };

  return ConnectionHistory;
};
