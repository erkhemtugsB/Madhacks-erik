const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// serve static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

let rooms = {}; // { roomId: Set<ws> }

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    const { type, room, payload } = msg;

    // Join room
    if (type === "join") {
      ws.room = room;
      rooms[room] = rooms[room] || new Set();
      rooms[room].add(ws);

      // Tell others a new peer joined
      rooms[room].forEach((peer) => {
        if (peer !== ws) {
          peer.send(JSON.stringify({ type: "new-peer" }));
        }
      });
      return;
    }

    // Relay offers/answers/candidates to room peers
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room].forEach((peer) => {
        if (peer !== ws) {
          peer.send(JSON.stringify({ type, payload }));
        }
      });
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room].delete(ws);
    }
  });
});

server.listen(3000, () => {
  console.log("Local video chat server running on http://0.0.0.0:3000");
});
