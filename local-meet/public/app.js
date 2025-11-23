let localStream;
let ws;
let peers = {}; // map: peerId -> RTCPeerConnection
let room;
let joined = false; // prevent multiple joins from repeated clicks
let myId = null;
let pendingCandidates = {}; // map: remoteId -> [candidateInit]
// dedupe recent final messages to avoid duplicates
const recentMsgSet = new Set();
// map of last interim DOM element per sender id
const lastInterimEl = {};

// UI elements
const joinBtn = document.getElementById("joinBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");
const leaveBtn = document.getElementById("leaveBtn");
const statusSpan = document.getElementById("status");

// status helper: update colored dot and tooltip
function setStatus(state) {
  if (!statusSpan) return;
  const dot = statusSpan.querySelector('.status-dot');
  if (!dot) return;
  dot.classList.remove('connected','connecting','disconnected');
  if (state) dot.classList.add(state);
  statusSpan.title = state ? (state.charAt(0).toUpperCase() + state.slice(1)) : '';
}

function leave() {
  if (!joined && (!ws || ws.readyState !== WebSocket.OPEN)) return;

  // Close WebSocket (server will broadcast peer-left on close)
  try {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
  } catch (e) {
    console.warn("Error closing ws:", e);
  }

  // Close all peer connections
  Object.keys(peers).forEach((id) => {
    try {
      peers[id].close();
    } catch (e) {}
    delete peers[id];
  });

  // Remove remote video elements
  Array.from(remoteVideos.children).forEach((el) => {
    el.srcObject = null;
    el.remove();
  });

  // Stop local media
  if (localStream) {
    try {
      localStream.getTracks().forEach((t) => t.stop());
    } catch (e) {}
    localStream = null;
    localVideo.srcObject = null;
  }

  joined = false;
  joinBtn.disabled = false;
  joinBtn.textContent = "Join Room";
  leaveBtn.disabled = true;
  setStatus('disconnected');
}

// Wire leave button
if (leaveBtn) leaveBtn.onclick = leave;

// Submission form handling (AJAX file upload)
const submissionForm = document.getElementById("submissionForm");
const fileInput = document.getElementById("fileInput");
const uploadResult = document.getElementById("uploadResult");
if (submissionForm) {
  submissionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadResult.textContent = "Uploading...";
    const file = fileInput.files[0];
    if (!file) {
      uploadResult.textContent = "Select a file first.";
      return;
    }
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        uploadResult.textContent = `Uploaded as ${json.filename} (original: ${json.originalname})`;
      } else {
        uploadResult.textContent = `Upload failed: ${json.error || 'unknown'}`;
      }
    } catch (err) {
      uploadResult.textContent = `Upload error: ${err.message}`;
    }
  });
}

// Helper to upload a single File object using the same /upload endpoint
async function uploadSingleFile(file, showResult = true) {
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (json && json.success) {
      if (showResult && uploadResult) uploadResult.textContent = `Uploaded ${json.originalname || file.name}`;
      try { if (typeof fetchFiles === 'function') fetchFiles(); } catch (e) {}
      return json;
    } else {
      if (showResult && uploadResult) uploadResult.textContent = `Upload failed: ${json && json.error}`;
      return null;
    }
  } catch (err) {
    if (showResult && uploadResult) uploadResult.textContent = `Upload error: ${err.message}`;
    return null;
  }
}

// Dropbox handling for the uploads panel
const dropZone = document.getElementById('dropZone');
const dropInput = document.getElementById('dropInput');
if (dropZone) {
  dropZone.addEventListener('click', (e) => { if (dropInput) dropInput.click(); });
  dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', (e) => { dropZone.classList.remove('dragover'); });
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const dt = e.dataTransfer;
    if (!dt) return;
    const files = Array.from(dt.files || []);
    if (files.length === 0) return;
    if (uploadResult) uploadResult.textContent = 'Uploading...';
    for (const f of files) {
      await uploadSingleFile(f);
    }
  });
}
if (dropInput) {
  dropInput.addEventListener('change', async (e) => {
    const files = Array.from(dropInput.files || []);
    if (files.length === 0) return;
    if (uploadResult) uploadResult.textContent = 'Uploading...';
    for (const f of files) {
      await uploadSingleFile(f);
    }
    dropInput.value = '';
  });
}

async function initLocalStream() {
  if (localStream) return; // already initialized
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localVideo.srcObject = localStream;
}

async function createPeer(ws, isInitiator, remoteId) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
    ],
  });

  // Send ICE candidates to others
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      const msg = {
        type: "candidate",
        payload: e.candidate,
      };
      // include `to` when we know the remote peer id so server can route directly
      if (remoteId) msg.to = remoteId;
      ws.send(JSON.stringify(msg));
    }
  };

  // Add remote video on track event
  pc.ontrack = (event) => {
    const stream = event.streams[0];
    if (!stream) return;

    // Avoid adding duplicate video elements for the same MediaStream
    const existing = Array.from(remoteVideos.children).find(
      (el) => el.dataset && el.dataset.streamId === stream.id
    );
    if (existing) {
      existing.srcObject = stream;
      return;
    }

    const vid = document.createElement("video");
    vid.autoplay = true;
    vid.playsInline = true;
    vid.srcObject = stream;
    vid.dataset.streamId = stream.id;
    if (remoteId) vid.dataset.peerId = remoteId;
    remoteVideos.appendChild(vid);
  };

  // Add local tracks
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // store by remoteId when provided
  if (remoteId) peers[remoteId] = pc;

  // drain any pending ICE candidates for this remote
  if (remoteId && pendingCandidates[remoteId]) {
    pendingCandidates[remoteId].forEach((c) => {
      pc.addIceCandidate(new RTCIceCandidate(c)).catch((e) => console.warn(e));
    });
    delete pendingCandidates[remoteId];
  }

  // If initiator, send offer
  if (isInitiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const msg = { type: "offer", payload: offer };
    if (remoteId) msg.to = remoteId;
    ws.send(JSON.stringify(msg));
  }

  return pc;
}

joinBtn.onclick = async () => {
  if (joined) return;
  joined = true;
  joinBtn.disabled = true;
  joinBtn.textContent = "Joined";

  room = document.getElementById("roomInput").value;

  try {
    await initLocalStream();
  } catch (err) {
    // If getUserMedia fails, allow retry
    console.error("getUserMedia failed:", err);
    joined = false;
    joinBtn.disabled = false;
    joinBtn.textContent = "Join Room";
    return;
  }

  setStatus('connecting');

  // Choose WebSocket protocol based on page protocol so WSS is used over HTTPS.
  const wsProto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${wsProto}://${location.host}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", room }));
    setStatus('connected');
    leaveBtn.disabled = false;
  };

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "id") {
      myId = data.id;
      // peers list contains existing peer ids (we'll wait for their offers)
      console.log("Assigned id", myId, "existing peers:", data.peers);
      // fetch conversation history for this room
      try { fetchMessages(); } catch (e) {}
      return;
    }

    if (data.type === "new-peer") {
      // a new peer joined, create an offer
      const remoteId = data.id;
      await createPeer(ws, true, remoteId);
      return;
    }

    if (data.type === "offer") {
      const remoteId = data.from;
      const pc = peers[remoteId] || (await createPeer(ws, false, remoteId));

      await pc.setRemoteDescription(data.payload);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // send answer directly to the original offerer
      ws.send(JSON.stringify({ type: "answer", payload: answer, to: remoteId }));
      return;
    }

    if (data.type === "answer") {
      const remoteId = data.from;
      const pc = peers[remoteId];
      if (pc) await pc.setRemoteDescription(data.payload);
      return;
    }

    if (data.type === "candidate") {
      const remoteId = data.from;
      const pc = peers[remoteId];
      if (pc) {
        const candidate = new RTCIceCandidate(data.payload);
        pc.addIceCandidate(candidate).catch((e) => console.warn(e));
      } else {
        // buffer candidate until peer connection is created
        pendingCandidates[remoteId] = pendingCandidates[remoteId] || [];
        pendingCandidates[remoteId].push(data.payload);
      }
      return;
    }

    if (data.type === "peer-left") {
      const remoteId = data.id;
      const pc = peers[remoteId];
      if (pc) {
        try {
          pc.close();
        } catch (e) {}
        delete peers[remoteId];
      }

      // remove remote video elements for that peer
      Array.from(remoteVideos.children).forEach((el) => {
        if (el.dataset && el.dataset.peerId === remoteId) {
          el.srcObject = null;
          el.remove();
        }
      });
      return;
    }
    // real-time transcript/chat from peers
    if (data.type === 'transcript' || data.type === 'chat') {
      const from = data.from;
      const payload = data.payload || {};
      const text = payload.text || (typeof payload === 'string' ? payload : '');
      const final = !!payload.final;
      // append incoming message (dedup handled inside)
      appendChatMessage({ from, text, final, type: data.type });
      return;
    }
  };

  ws.onclose = () => {
    // allow re-joining if connection closes
    joined = false;
    joinBtn.disabled = false;
    joinBtn.textContent = "Join Room";
    leaveBtn.disabled = true;
    setStatus('disconnected');
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
};

// --- Chat / Dictation UI ---
const chatList = document.getElementById('chatList');
const dictateBtn = document.getElementById('dictateBtn');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const summarizeBtn = document.getElementById('summarizeBtn');

function appendChatMessage({ from, text, final, type }) {
  if (!chatList) return;
  // dedupe by from+text for final messages
  const key = `${from}|${text}`;
  if (final) {
    if (recentMsgSet.has(key)) return; // already have this exact final message
    recentMsgSet.add(key);
    // if there is an interim element for this sender, replace it
    const interimEl = lastInterimEl[from];
    if (interimEl) {
      interimEl.classList.remove('interim');
      interimEl.classList.add('final');
      const txt = interimEl.querySelector('.chat-text');
      if (txt) txt.textContent = text;
      delete lastInterimEl[from];
      chatList.scrollTop = chatList.scrollHeight;
      return;
    }
  } else {
    // interim: update existing interim element or create one
    if (lastInterimEl[from]) {
      const el0 = lastInterimEl[from];
      const txt0 = el0.querySelector('.chat-text');
      if (txt0) txt0.textContent = text;
      chatList.scrollTop = chatList.scrollHeight;
      return;
    }
  }

  const el = document.createElement('div');
  el.className = 'chat-item' + (final ? ' final' : ' interim');
  const who = document.createElement('div');
  who.className = 'chat-who';
  who.textContent = from === myId ? 'You' : `Peer ${from}`;
  const txt = document.createElement('div');
  txt.className = 'chat-text';
  txt.textContent = text;
  el.appendChild(who);
  el.appendChild(txt);
  chatList.appendChild(el);
  if (!final) lastInterimEl[from] = el;
  chatList.scrollTop = chatList.scrollHeight;
}

// Fetch existing messages for the room
async function fetchMessages() {
  if (!room) return;
  try {
    const res = await fetch(`/messages?room=${encodeURIComponent(room)}`);
    const json = await res.json();
    if (!json.success) return;
    if (!chatList) return;
    // reset
    chatList.innerHTML = '';
    recentMsgSet.clear();
    Object.keys(lastInterimEl).forEach(k=>delete lastInterimEl[k]);
    json.messages.forEach((m) => {
      // treat persisted messages as final
      appendChatMessage({ from: m.from, text: m.text, final: true, type: m.type });
    });
  } catch (e) {
    console.warn('Failed to fetch messages', e);
  }
}

// wire fetchMessages after join
const origOnId = null;
// call fetchMessages when assigned id (i.e., after join completes)
const _origWsOnMessage = null;

// expose simple chat send
if (sendChat) sendChat.onclick = () => {
  const text = chatInput.value && chatInput.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
  const msg = { type: 'chat', payload: { text }, room };
  ws.send(JSON.stringify(msg));
  appendChatMessage({ from: myId, text, final: true, type: 'chat' });
  chatInput.value = '';
};

// Summarize current chat history using /summarize endpoint
if (summarizeBtn) summarizeBtn.onclick = async () => {
  try {
    // Collect all chat text nodes
    const items = Array.from(document.querySelectorAll('#chatList .chat-item .chat-text'));
    const lines = items.map(el => el.textContent.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert('No chat history to summarize yet.');
      return;
    }
    const text = lines.join('\n');
    const res = await fetch('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const json = await res.json();
    if (!json.success) {
      alert('Summarize failed: ' + (json.error || 'unknown'));
      return;
    }
    const summary = json.summary || '';
    // Download summary as a text file
    const blob = new Blob([summary + '\n'], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'summary.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 200);
  } catch (e) {
    alert('Error summarizing: ' + e.message);
  }
};

// Dictation via Web Speech API
let recognition = null;
let dictating = false;
if (dictateBtn) {
  dictateBtn.onclick = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('SpeechRecognition API not supported in this browser.');
      return;
    }
    if (!recognition) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (ev) => {
        let interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; ++i) {
          const result = ev.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            // split final result into sentences and send each sentence separately
            const sentences = text.match(/[^.!?\n]+[.!?\n]?/g) || [text];
            for (let s of sentences) {
              s = s.trim();
              if (!s) continue;
              // send final sentence
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'transcript', payload: { text: s, final: true }, room }));
              }
              appendChatMessage({ from: myId, text: s, final: true, type: 'transcript' });
            }
          } else {
            interim += text;
          }
        }
        if (interim) {
          // show interim transcript locally (do not send interim to server)
          appendChatMessage({ from: myId, text: interim, final: false, type: 'transcript' });
        }
      };
      recognition.onerror = (e) => console.warn('SpeechRecognition error', e);
    }
    if (!dictating) {
      recognition.start();
      dictating = true;
      dictateBtn.textContent = 'Stop Dictation';
    } else {
      recognition.stop();
      dictating = false;
      dictateBtn.textContent = 'Start Dictation';
    }
  };
}

// call fetchMessages when we know the room (after join id message)
const originalOnMessage = ws ? ws.onmessage : null;
// We can't hook into the closure easily here; instead, call fetchMessages from id handler above.

async function loadFiles() {
  if (!window.currentRoom) return;

  const res = await fetch(`/files?room=${encodeURIComponent(window.currentRoom)}`);
  const data = await res.json();

  const list = document.getElementById("fileList");
  const fileCount = document.getElementById("fileCount");
  list.innerHTML = "";

  data.files.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="/file/${f.filename}" target="_blank">${f.originalname}</a>
    `;
    list.appendChild(li);
  });

  fileCount.textContent = `(${data.files.length})`;
}

document.getElementById("refreshFiles").onclick = loadFiles;

async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("room", window.currentRoom);

  await fetch("/upload", {
    method: "POST",
    body: form
  });
}

if (msg.type === "file-upload") {
  loadFiles();
}
