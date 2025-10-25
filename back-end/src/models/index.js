const Sequelize = require("sequelize");
const DataTypes = require("sequelize");
const colors = require("colors");
const { logger } = require("../logger/winston.logger.js");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,

  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    logger.info(colors.blue("Models synchronized successfully."));
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// Synchronize models with the database

const db = {};

db.Sequelize = Sequelize;
db.Op = Sequelize.Op;
db.sequelize = sequelize;

//* IMPORT MODELS

db.User = require("./user.models.js")(sequelize, Sequelize, DataTypes);
db.Message = require("./message.models.js")(sequelize, Sequelize, DataTypes);
db.ChatMember = require("./chat-member.models.js")(
  sequelize,
  Sequelize,
  DataTypes
);
db.Chat = require("./chats.models.js")(sequelize, Sequelize, DataTypes);

//* ASSOCIATE MODELS

db.User.hasMany(db.Chat, { foreignKey: "user_id", as: "user" });
db.Chat.belongsTo(db.User, { foreignKey: "user_id", as: "user" });

db.User.hasMany(db.Chat, { foreignKey: "recipient_id", as: "recipientId" });
db.Chat.belongsTo(db.User, { foreignKey: "recipient_id", as: "recipientId" });

// Chat to ChatMember association
db.Chat.hasMany(db.ChatMember, { foreignKey: "chat_id" });
db.ChatMember.belongsTo(db.Chat, { foreignKey: "chat_id" });

// User to ChatMember association
db.User.hasMany(db.ChatMember, { foreignKey: "user_id" });
db.ChatMember.belongsTo(db.User, { foreignKey: "user_id" });

// Chat to Message association
db.Chat.hasMany(db.Message, { foreignKey: "chat_id", as: "chats" });
db.Message.belongsTo(db.Chat, { foreignKey: "chat_id", as: "chats" });

// User to Message association
db.User.hasMany(db.Message, { foreignKey: "sender_id", as: "sender" });
db.Message.belongsTo(db.User, { foreignKey: "sender_id", as: "sender" });

(async () => {
  try {
    await sequelize.sync({ force: false }); // Set force to true for development, false for production
    logger.info("Models synchronized successfully....");
  } catch (error) {
    console.error("Unable to synchronize models with the database:", error);
  }
})();

module.exports = db;
