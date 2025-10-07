module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      hours: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nombreMaxParticipants: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      organizers: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      participants: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      region: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "events",
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.User, { foreignKey: "userId" });
    Event.belongsTo(models.Category, { foreignKey: "categoryId" });
    Event.hasMany(models.EventParticipants, { foreignKey: "eventId" });
    Event.hasMany(models.Favorite, { foreignKey: "eventId" });
  };

  return Event;
};
