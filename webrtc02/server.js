/**
 * このプログラムは以下を参考に作成しています.
 * https://github.com/TannerGabriel/WebRTC-Video-Broadcast/blob/master/server.js
 */
const express = require("express");
const app = express();
const fs = require('fs');

const port = 3000; // 1024以下にした場合は管理者権限が必要になります.

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => {
  // エラー発生時
  console.log(e);
});

io.sockets.on("connection", socket => {
  // 公開時
  socket.on("broadcaster", ()=> {
    console.log('broadcaster', socket.id);
    socket.broadcast.emit("broadcaster", socket.id);
  });
  
  socket.on("offer", (id, message) => {
    console.log('offer', socket.id, id, message);
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    console.log('answer', socket.id, id, message);
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    console.log('candidate', socket.id, id, message);
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", () => {
    console.log('disconnect', socket.id);
    socket.broadcast.emit("disconnectPeer", socket.id);
  });
});
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
