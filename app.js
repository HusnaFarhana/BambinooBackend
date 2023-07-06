const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const Chat = require("./model/chatModel");
const cron = require("node-cron");

const io = require("socket.io")(4000, {
  cors: {
    origin: ["http://localhost:4200"],
  },
});

cron.schedule("0 0 * * *", async () => {
  try {
    const chatCount = await Chat.countDocuments();
    const excessChats = chatCount - 50;
    if (excessChats > 0) {
      const chatsToDelete = await Chat.find().limit(excessChats);
      await Chat.deleteMany({
        _id: { $in: chatsToDelete.map((chat) => chat._id) },
      });
    }
  } catch (error) {
    console.error("Error deleting excess chats:", error);
  }
});

const path = require("path");
const bodyParser = require("body-parser");
const app = express();

io.on("connection", (socket) => {
  socket.on("user-joined", ({ username }) => {
    const systemMessage = `${username} has joined the chat.`;
    socket.broadcast.emit("system-message", systemMessage);
  });
  
  socket.on("send-message", async ({ message, username }) => {
    if (username == "Admin") {
      const chat = new Chat({
        content: message,
        time: new Date().toLocaleTimeString(),
        type: "sent",
        username: username,
      });
      await chat.save();
    } else {
      const chat = new Chat({
        content: message,
        time: new Date().toLocaleTimeString(),
        type: "received",
        username: username,
      });
      await chat.save();
    }

    socket.broadcast.emit("receive-message", {
      content: message,
      time: new Date().toLocaleTimeString(),
      type: "received",
      username: username,
    });
  });
});

require("dotenv").config();
app.options("*", cors());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:4200"],
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "uploads")));

const userRouter = require("./routes/userRoute");
const adminRouter = require("./routes/adminRoute");
const staffRouter = require("./routes/staffRoute");
const port = process.env.PORT || 3500;

app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use("/staff", staffRouter);

mongoose.connect("mongodb://127.0.0.1:27017/bambino");

mongoose.connection.on("connected", () => {
  console.log("connected to mongo db");
});

app.listen(port, () => {
  console.log("listening on port 3500");
});
