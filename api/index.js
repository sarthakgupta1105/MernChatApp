const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const User = require("./models/User");
const Message = require("./models/Message");
const ws = require("ws");
const fs = require("fs");

mongoose
  .connect("mongodb://127.0.0.1:27017/chatapp")
  .then(() => console.log("database connected"));
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "secret";

app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/test", (req, res) => {
  res.json("test");
});

app.get("/people", async (req, res) => {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  let ourUserId = null;
  const token = req.cookies?.token;
  jwt.verify(token, jwtSecret, {}, (err, token) => {
    if (err) throw err;
    if (token) {
      // console.log(token);
      ourUserId = token.id;
      // console.log(ourUserId);
    }
  });
  let messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    let userDoc = await User.findOne({ username });
    if (userDoc) {
      let passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign(
          { username: userDoc.username, id: userDoc._id },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;
            res.cookie("token", token).status(200).json("logged in");
          }
        );
      }
    }
  } catch (e) {
    throw err;
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "", {}).json("ok");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    let userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    jwt.sign({ id: userDoc._id, username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token).status(201).json({
        id: userDoc._id,
      });
    });
  } catch (e) {
    console.log(e);
  }
});

const server = app.listen(8000, () => {
  console.log("server is listening to port 8000");
});

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connection, req) => {
  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            username: c.username,
            userId: c.userId,
          })),
        })
      );
    });
  }
  // something new,try to understand
  connection.isAlive = true;
  connection.timer = setInterval(()=>{
      connection.ping();
      connection.deathTimer = setTimeout(()=>{
          connection.isAlive=false;
          clearInterval(connection.timer)
          connection.terminate();
          notifyAboutOnlinePeople();
          console.log('connection closed');
      },1000)
  },5000);
  connection.on('pong',()=>{
      clearTimeout(connection.deathTimer);
  })
  //read userId and username from cookie for this connection
  const cookie = req.headers.cookie;
  if (cookie) {
    const cookieTokenString = cookie
      .split(";")
      .find((str) => str.startsWith("token="));
    if (cookieTokenString) {
      const token = cookieTokenString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          console.log(userData);
          // console.log(userData.id);
          connection.userId = userData.id;
          console.log(connection.userId);
          connection.username = userData.username;
          // console.log(connection.username);
        });
      }
    }
  }

  //sending message
  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    console.log(messageData);
    const { recipient, text, file } = messageData;
    console.log(recipient, text, file);
    let filename = null;
    if (file) {
      // console.log(file);
      let parts = file.name.split(".");
      let ext = parts[parts.length - 1];
      filename = Date.now() + "." + ext;
      const pathname = __dirname + "/uploads/" + filename;
      const bufferData = new Buffer(file.data.split(",")[1], "base64");
      fs.writeFile(pathname, bufferData, () => {
        console.log("file saved:" + pathname);
      });
    }
    const messageDoc = await Message.create({
      sender: connection.userId,
      recipient,
      text,
      file: file ? filename : null,
    });
    console.log(messageDoc);
    if (recipient && (text || file)) {
      console.log(text, file, recipient);
      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text: messageDoc.text,
              file: file ? filename : null,
              recipient: messageDoc.recipient,
              sender: connection.userId,
              _id: messageDoc._id,
            })
          )
        );
        console.log("sending messageData");
    }
  });

  //notify everyone about onlinePeople (when people login)
  // console.log([...wss.clients].map(c=>c.userId))
  // console.log([...wss.clients].map(c=>c.username))
  notifyAboutOnlinePeople();
});
