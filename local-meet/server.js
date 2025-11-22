const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const WebSocket = require("ws");
const path = require("path");

const app = express();

// Prefer HTTPS if cert files exist (created in `cert/` by user).
let server;
let usingHttps = false;
const keyPath = path.join(__dirname, "cert", "server.key");
const certPath = path.join(__dirname, "cert", "server.cert");
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  try {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    server = https.createServer(options, app);
    usingHttps = true;
  } catch (err) {
    console.error("Failed to create HTTPS server, falling back to HTTP:", err);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

const wss = new WebSocket.Server({ server });

// serve static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

let rooms = {}; // { roomId: Set<ws> }

wss.on("connection", (ws) => {
  // assign a short id for this connection
  ws.id = Math.random().toString(36).substr(2, 9);
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    const { type, room, payload, to } = msg;

    // Join room
    if (type === "join") {
      ws.room = room;
      rooms[room] = rooms[room] || new Set();
      // collect existing peer ids before adding
      const existingPeerIds = Array.from(rooms[room]).map((p) => p.id);
      rooms[room].add(ws);

      // Tell joining client its id and list of existing peers
      ws.send(JSON.stringify({ type: "id", id: ws.id, peers: existingPeerIds }));

      // Notify existing peers that a new peer joined (provide the new peer's id)
      rooms[room].forEach((peer) => {
        if (peer !== ws) {
          peer.send(JSON.stringify({ type: "new-peer", id: ws.id }));
        }
      });
      return;
    }

    // Relay offers/answers/candidates to room peers
    if (ws.room && rooms[ws.room]) {
      if (to) {
        // route to a specific peer if requested
        const target = Array.from(rooms[ws.room]).find((p) => p.id === to);
        if (target && target !== ws) {
          target.send(JSON.stringify({ type, payload, from: ws.id }));
        }
      } else {
        rooms[ws.room].forEach((peer) => {
          if (peer !== ws) {
            // include sender id so clients can route messages to the right peer
            peer.send(JSON.stringify({ type, payload, from: ws.id }));
          }
        });
      }
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room].delete(ws);
      // notify remaining peers that this peer left
      rooms[ws.room].forEach((peer) => {
        peer.send(JSON.stringify({ type: "peer-left", id: ws.id }));
      });
    }
  });
});

if (usingHttps) {
  server.listen(3000, () => {
    console.log("Local video chat server running on https://0.0.0.0:3000");
    console.log("Note: this uses a self-signed certificate — your browser may warn you.");
  });
  // Optional: also start a small HTTP redirect server so visits to http://IP:3001 can be redirected
  const redirect = http.createServer((req, res) => {
    const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
    res.writeHead(301, { Location: `https://${host}:3000${req.url}` });
    res.end();
  });
  redirect.listen(3001, () => {
    console.log("HTTP redirect server running on http://0.0.0.0:3001 (redirects to HTTPS :3000)");
  });
} else {
  server.listen(3000, () => {
    console.log("Local video chat server running on http://0.0.0.0:3000");
  });
}
