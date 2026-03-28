const socket = io("https://juegodeestrategiaepico.onrender.com");

let codigo = "";
let nombre = prompt("Tu nombre:") || "Jugador";

let jugadores = [];
let jugadorActual = "";
let dueños = {};
let geojsonLayer;
let modo = "normal";

// UI
function actualizarUI() {
  document.getElementById("info").innerHTML =
    "👤 " + nombre +
    "<br>🎮 Sala: " + codigo +
    "<br>⏳ Turno: " + jugadorActual;
}

// 🎮 CREAR SALA
function crearSala() {
  console.log("Crear sala funciona");

  codigo = Math.random().toString(36).substring(2, 7).toUpperCase();

  socket.emit("crearSala", { codigo, nombre });

  alert("Sala creada: " + codigo);
}

// 🎮 UNIRSE
function unirseSala() {
  console.log("Unirse funciona");

  codigo = prompt("Código:");
  socket.emit("unirseSala", { codigo, nombre });
}

// 👥 jugadores
socket.on("listaJugadores", (lista) => {
  jugadores = lista;
});

// turno
socket.on("turnoActual", (jugador) => {
  jugadorActual = jugador.nombre;
  actualizarUI();
});

// conquistar
socket.on("actualizarPais", ({ pais, jugador }) => {
  dueños[pais] = jugador;
});

// chat
socket.on("chat", ({ nombre, mensaje }) => {
  let chat = document.getElementById("chat");
  if (chat) {
    chat.innerHTML += `<div><b>${nombre}:</b> ${mensaje}</div>`;
  }
});sss