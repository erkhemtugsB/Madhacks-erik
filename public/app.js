let localStream;
let ws;
let peers = {}; // map: peerId -> RTCPeerConnection
let room;
let joined = false; // prevent multiple joins from repeated clicks
let myId = null;
let pendingCandidates = {}; // map: remoteId -> [candidateInit]

// UI elements
const joinBtn = document.getElementById("joinBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");
const leaveBtn = document.getElementById("leaveBtn");
const statusSpan = document.getElementById("status");

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
  statusSpan.textContent = "Disconnected";
}

// Wire leave button
if (leaveBtn) leaveBtn.onclick = leave;

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

  statusSpan.textContent = "Connecting...";

  // Choose WebSocket protocol based on page protocol so WSS is used over HTTPS.
  const wsProto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${wsProto}://${location.host}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", room }));
    statusSpan.textContent = "Connected";
    leaveBtn.disabled = false;
  };

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "id") {
      myId = data.id;
      // peers list contains existing peer ids (we'll wait for their offers)
      console.log("Assigned id", myId, "existing peers:", data.peers);
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
  };

  ws.onclose = () => {
    // allow re-joining if connection closes
    joined = false;
    joinBtn.disabled = false;
    joinBtn.textContent = "Join Room";
    leaveBtn.disabled = true;
    statusSpan.textContent = "Disconnected";
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
};
