const socket = io();
// const room = window.location.pathname.split('/').pop();
const room = Math.random().toString(36).substr(2, 9);

console.log(room)

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

socket.emit('join', room);

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localVideo.srcObject = stream;
  localStream = stream;
});

socket.on('user-connected', async () => {
  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate, room });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { offer, room });
});

socket.on('offer', async ({ offer }) => {
  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate, room });
    }
  };

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

// Share link UI
const meetingURL = `${window.location.origin}/${room}`;
document.getElementById('meetingURL').value = meetingURL;
const message = encodeURIComponent(`Join the meeting: ${meetingURL}`);
document.getElementById('whatsappLink').href = `https://wa.me/?text=${message}`;
document.getElementById('mailLink').href = `mailto:?subject=Meeting Invitation&body=${message}`;
