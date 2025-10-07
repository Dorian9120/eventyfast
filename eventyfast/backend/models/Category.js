module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "categories",
    }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Event, { foreignKey: "categoryId" });
  };

  return Category;
};
