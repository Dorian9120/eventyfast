module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      questionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "messages",
    });
  
    Message.associate = models => {
      Message.belongsTo(models.User, { foreignKey: 'userId', as: 'User' });
      Message.belongsTo(models.Event, { foreignKey: 'eventId' });
      Message.belongsTo(models.Message, { foreignKey: 'questionId', as: 'question' });
      Message.hasMany(models.Message, { foreignKey: 'questionId', as: 'response' });
    };
  
    return Message;
  };
  