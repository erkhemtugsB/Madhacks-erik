require('dotenv').config();
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const WebSocket = require("ws");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json({ limit: '256kb' }));

// Initialize Gemini (requires GEMINI_APIKEY in environment)
let model = null;
try {
  if (process.env.GEMINI_APIKEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("Gemini model ready");
  } else {
    console.warn("GEMINI_APIKEY not set; paraphrase/summarize will fallback");
  }
} catch (e) {
  console.warn("Gemini init failed", e.message || e);
}

// ensure storage directory exists for uploads
const storageDir = path.join(__dirname, "storage");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// multipart file upload handling
const multer = require("multer");
const upload = multer({ dest: storageDir });
// Separate upload handler for paraphrase route (keep original upload unaffected)
const paraphraseUpload = multer({ dest: 'uploads/' });

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

// Serve repo-root logo.png at `/logo.png` so header can load it from the repo root
app.get('/logo.png', (req, res) => {
  const logoPath = path.join(__dirname, '..', 'logo.png');
  if (fs.existsSync(logoPath)) {
    res.sendFile(logoPath);
  } else {
    res.status(404).end();
  }
});

// upload endpoint: accepts a single file field named "file"
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "no file" });
  // return filename and original name
  res.json({ success: true, filename: req.file.filename, originalname: req.file.originalname });
});

let rooms = {}; // { roomId: Set<ws> }
let messages = {}; // { roomId: [ { type, text, from, timestamp, final } ] }

wss.on("connection", (ws) => {
  // assign a short id for this connection
  ws.id = Math.random().toString(36).substr(2, 9);
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    const { type, room, payload, to } = msg;

    // persist chat/transcript messages so clients can fetch conversation history
    if ((type === 'chat' || type === 'transcript') && ws.room) {
      messages[ws.room] = messages[ws.room] || [];
      try {
        const entry = {
          type,
          text: payload && payload.text ? payload.text : (typeof payload === 'string' ? payload : ''),
          from: ws.id,
          timestamp: Date.now(),
          final: payload && !!payload.final,
        };
        messages[ws.room].push(entry);
        // cap history to last 100 messages per room
        if (messages[ws.room].length > 100) messages[ws.room].shift();
      } catch (e) {
        console.warn('Failed to persist message', e);
      }
    }

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

// return conversation history for a room
app.get('/messages', (req, res) => {
  const roomQ = req.query.room;
  if (!roomQ) return res.status(400).json({ success: false, error: 'room required' });
  res.json({ success: true, messages: messages[roomQ] || [] });
});

// Upload & paraphrase route using Gemini
// app.post('/paraphrase', paraphraseUpload.single('file'), async (req, res) => {
//   if (!req.file) return res.status(400).send('No file uploaded.');
//   const originalText = fs.readFileSync(req.file.path, 'utf-8');
//   let paraphrased = originalText;
//   if (model) {
//     try {
//       const prompt = `Paraphrase and fix the grammar of the text. Keep meaning the same. Keep it direct, simple 1 sentence without any additional words.\n\nText: ${originalText}`;
//       const result = await model.generateContent(prompt);
//       paraphrased = await result.response.text();
//     } catch (e) {
//       console.warn('Gemini paraphrase failed, returning original text', e.message || e);
//     }
//   }
//   const outputPath = `output-${Date.now()}.txt`;
//   fs.writeFileSync(outputPath, paraphrased);
//   res.download(outputPath, 'paraphrased.txt', () => {
//     try { fs.unlinkSync(req.file.path); } catch {}
//     try { fs.unlinkSync(outputPath); } catch {}
//   });
// });

// Summarize chat history (client sends full text)
app.post('/summarize', async (req, res) => {
  const text = (req.body && req.body.text) ? String(req.body.text) : '';
  if (!text.trim()) return res.status(400).json({ success: false, error: 'text required' });
  let summary = text;
  if (model) {
    try {
      const prompt = `Paraphrase and fix the grammar of the text. Keep meaning the same. Keep it direct, simple 1 sentence without any additional words.\n\nText:\n${text}`;
      const result = await model.generateContent(prompt);
      summary = (await result.response.text()).trim() || summary;
    } catch (e) {
      console.warn('Gemini summarize failed, using original text', e.message || e);
    }
  }
  res.json({ success: true, summary });
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
