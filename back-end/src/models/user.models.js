// user.model.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
      },
      first_name: {
        type: DataTypes.TEXT,
      },
      last_name: {
        type: DataTypes.TEXT,
      },
      username: {
        type: DataTypes.STRING(255),
        unique: true,
      },

      profile_picture: {
        type: DataTypes.STRING,
        defaultValue: "https://i.pravatar.cc/300?u=default",
      },
    },
    {
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return User;
};
