module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "categories",
      timestamps: true,
      underscored: true,
    }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Todo, {
      foreignKey: "category_id",
      as: "todos",
    });
  };

  return Category;
};
