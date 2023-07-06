const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema({
  content: String,
  time: String,
  type: String,
  username: String,
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;