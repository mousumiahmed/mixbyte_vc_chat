// const { name } = require("ejs");

const socket = io();
// const room = window.location.pathname.split('/').pop();
const room = window.location.hash.substr(1) || Math.random().toString(36).substr(2, 9);


// const localVideo = document.getElementById('localVideo');
let localStream;

async function startMedia() {
  try {
    // Request camera and microphone
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // Attach local stream to your video element
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = localStream;

    return localStream;
  } catch (err) {
    console.error("Error accessing media devices:", err);
    if (err.name === "NotReadableError") {
      alert("Camera or microphone is already in use.");
    }
  }
}


const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
let peerConnection;

async function createConnection() {
  peerConnection = new RTCPeerConnection(servers);

  // Add local tracks to the connection
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // When remote tracks arrive, show them in the remote video element
  peerConnection.ontrack = event => {
    const remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.srcObject = event.streams[0];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate, room });
    }
  };
}

async function callPeer() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { offer, room });
}

socket.on('offer', async ({ offer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { answer, room });
});


socket.on('answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', async ({ candidate }) => {
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

const joinbtn = document.getElementById("joinBtn")

  joinBtn.addEventListener("click", () => {
    
    window.location.href = `/dashboard/${room}`; // redirect to dashboard
  });


// Share link UI
document.addEventListener("DOMContentLoaded", () => {
  if (room) {
    const meetingURL = `${window.location.origin}/${room}`;
    document.getElementById('meetingURL').value = meetingURL;

    const message = encodeURIComponent(`Join the meeting: ${meetingURL}`);
    document.getElementById('whatsappLink').href = `https://wa.me/?text=${message}`;
    document.getElementById('mailLink').href = `mailto:?subject=Meeting Invitation&body=${message}`;

    const joinBtn = document.getElementById("joinBtn");
    joinBtn.style.display = "inline-block";

    joinBtn.addEventListener("click", async () => {
      // Redirect to room route
      window.location.href = meetingURL;
      await startMedia();           // 1. get local camera & mic
      await createConnection();     // 2. create peer connection
      socket.emit('join', room);    // 3. join the room via socket.io
    });
  }
});

