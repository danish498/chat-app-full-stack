// conversation.model.js
module.exports = (sequelize, DataTypes) => {
  const Chats = sequelize.define("Chats", {
    chat_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    recipient_id: {
      type: DataTypes.INTEGER,
    },
    admin_id: {
      type: DataTypes.INTEGER,
    },
    type: {
      type: DataTypes.ENUM("individual", "group"),
    },
    group_name: {
      type: DataTypes.STRING(255),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return Chats;
};
