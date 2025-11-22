let localStream;
let ws;
let peers = [];
let room;
let joined = false; // prevent multiple joins from repeated clicks

// UI elements
const joinBtn = document.getElementById("joinBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");

async function initLocalStream() {
  if (localStream) return; // already initialized
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localVideo.srcObject = localStream;
}

async function createPeer(ws, isInitiator) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
    ],
  });

  // Send ICE candidates to others
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      ws.send(
        JSON.stringify({
          type: "candidate",
          payload: e.candidate,
        })
      );
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
    remoteVideos.appendChild(vid);
  };

  // Add local tracks
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // If initiator, send offer
  if (isInitiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    ws.send(
      JSON.stringify({
        type: "offer",
        payload: offer,
      })
    );
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

  // Choose WebSocket protocol based on page protocol so WSS is used over HTTPS.
  const wsProto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${wsProto}://${location.host}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", room }));
  };

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "new-peer") {
      const pc = await createPeer(ws, true);
      peers.push(pc);
    }

    if (data.type === "offer") {
      const pc = await createPeer(ws, false);
      peers.push(pc);

      await pc.setRemoteDescription(data.payload);
      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: "answer", payload: answer }));
    }

    if (data.type === "answer") {
      const pc = peers[peers.length - 1];
      await pc.setRemoteDescription(data.payload);
    }

    if (data.type === "candidate") {
      const candidate = new RTCIceCandidate(data.payload);
      peers.forEach((pc) => pc.addIceCandidate(candidate));
    }
  };

  ws.onclose = () => {
    // allow re-joining if connection closes
    joined = false;
    joinBtn.disabled = false;
    joinBtn.textContent = "Join Room";
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
};
