module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isNumeric: true,
          len: [10, 15],
        },
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updateCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastUpdate: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
      twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isTwoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isTwoFactorVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
    },
    {
      tableName: "users",
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Event, { foreignKey: "userId" });
    User.hasMany(models.EventParticipants, { foreignKey: "userId" });
    User.hasMany(models.Favorite, { foreignKey: "userId" });
    User.hasMany(models.ConnectionHistory, {
      foreignKey: "userId",
      as: "connectionHistories",
    });
    User.hasMany(models.Notification, {
      foreignKey: "userId",
      as: "notifications",
    });
  };

  return User;
};
