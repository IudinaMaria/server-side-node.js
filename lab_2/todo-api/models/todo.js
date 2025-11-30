module.exports = (sequelize, DataTypes) => {
  const Todo = sequelize.define(
    "Todo",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "todos",
      timestamps: true,
      underscored: true,
    }
  );

  Todo.associate = (models) => {
    Todo.belongsTo(models.Category, {
      foreignKey: "category_id",
      as: "category",
    });
  };

  return Todo;
};
