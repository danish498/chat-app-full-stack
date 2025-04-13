// conversationParticipant.model.js
module.exports = (sequelize, DataTypes) => {
  const ChatMember = sequelize.define("ChatsMember", {
    chat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  });

  return ChatMember;
};
