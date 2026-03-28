let peers = {};
let stream;

async function iniciarVoz(jugadores) {

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  jugadores.forEach(j => {
    if (j.id === socket.id) return;

    crearConexion(j.id);
  });
}

function crearConexion(id) {

  let peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peers[id] = peer;

  stream.getTracks().forEach(track => peer.addTrack(track, stream));

  peer.ontrack = e => {
    let audio = document.createElement("audio");
    audio.srcObject = e.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  peer.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice-candidate", {
        to: id,
        candidate: e.candidate
      });
    }
  };

  peer.createOffer().then(offer => {
    peer.setLocalDescription(offer);

    socket.emit("offer", {
      to: id,
      from: socket.id,
      offer
    });
  });
}

socket.on("offer", async ({ from, offer }) => {

  let peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peers[from] = peer;

  stream.getTracks().forEach(track => peer.addTrack(track, stream));

  await peer.setRemoteDescription(offer);

  let answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("answer", { to: from, from: socket.id, answer });
});

socket.on("answer", ({ from, answer }) => {
  peers[from].setRemoteDescription(answer);
});

socket.on("ice-candidate", ({ from, candidate }) => {
  peers[from].addIceCandidate(candidate);
});