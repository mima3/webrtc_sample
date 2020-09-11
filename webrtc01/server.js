/**
 * このプログラムは以下を参考に作成しています.
 * https://github.com/TannerGabriel/WebRTC-Video-Broadcast/blob/master/server.js
 */
const express = require("express");
const app = express();
const fs = require('fs');
let broadcaster;
const port = 4000; // 1024以下にした場合は管理者権限が必要になります.

const https = require("https");
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.pem')
};

const server = https.createServer(options, app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
