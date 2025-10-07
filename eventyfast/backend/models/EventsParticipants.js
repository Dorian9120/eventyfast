module.exports = (sequelize, DataTypes) => {
  const EventParticipants = sequelize.define(
    "EventParticipants",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "events",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      ticketCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "eventparticipants",
    }
  );

  EventParticipants.associate = (models) => {
    EventParticipants.belongsTo(models.Event, { foreignKey: "eventId" });
    EventParticipants.belongsTo(models.User, { foreignKey: "userId" });
  };

  return EventParticipants;
};
