const socket = io(https://juegodeestrategiaepico.onrender.com);

let codigo = "";
let nombre = prompt("Tu nombre:");

let jugadores = [];
let jugadorActual = "";
let dueños = {};
let geojsonLayer;
let modo = "normal";

function actualizarUI() {
  document.getElementById("info").innerHTML =
    "👤 " + nombre +
    "<br>🎮 Sala: " + codigo +
    "<br>⏳ Turno: " + jugadorActual;
}

// SALAS
function crearSala() {
  codigo = Math.random().toString(36).substring(2, 7).toUpperCase();

  socket.emit("crearSala", { codigo, nombre });

  mostrarLobby();
}

function unirseSala() {
  codigo = prompt("Código:");
  socket.emit("unirseSala", { codigo, nombre });

  mostrarLobby();
}

// LOBBY
function mostrarLobby() {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
}

// CHAT
function enviarMensaje() {
  let input = document.getElementById("chatInput");

  socket.emit("chat", {
    codigo,
    nombre,
    mensaje: input.value
  });

  input.value = "";
}

socket.on("chat", ({ nombre, mensaje }) => {
  let chat = document.getElementById("chat");

  chat.innerHTML += `<div><b>${nombre}:</b> ${mensaje}</div>`;
});

// JUGADORES
socket.on("listaJugadores", (lista) => {
  jugadores = lista;
  if (typeof iniciarVoz === "function") iniciarVoz(lista);
});

// MAPA
let map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
.then(res => res.json())
.then(data => {

  function estilo(feature) {
    let pais = feature.properties.name;
    return {
      fillColor: dueños[pais] ? "red" : "#555",
      weight: 1,
      color: "#222"
    };
  }

  function onEach(feature, layer) {
    let pais = feature.properties.name;

    layer.on("click", () => {

      if (jugadorActual !== nombre) return;

      if (modo === "ataque") {
        socket.emit("accion", { codigo, pais, jugador: nombre });
        modo = "normal";
      }
    });
  }

  geojsonLayer = L.geoJSON(data, {
    style: estilo,
    onEachFeature: onEach
  }).addTo(map);

});

// ACTUALIZACIONES
socket.on("actualizarPais", ({ pais, jugador }) => {
  dueños[pais] = jugador;

  geojsonLayer.eachLayer(layer => {
    if (layer.feature.properties.name === pais) {
      layer.setStyle({ fillColor: jugador === nombre ? "green" : "red" });
    }
  });
});

socket.on("turnoActual", (jugador) => {
  jugadorActual = jugador.nombre;
  actualizarUI();
});

// RANKING
socket.on("ranking", (ranking) => {
  let html = "<h3>🏆 Ranking</h3>";

  for (let j in ranking) {
    html += `${j}: ${ranking[j]} pts<br>`;
  }

  document.getElementById("ranking").innerHTML = html;
});