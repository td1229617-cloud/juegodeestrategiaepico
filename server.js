const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let salas = {};
let rankingGlobal = {};
let economia = {}; // 🌍 datos económicos por país

// 🌍 BASE REALISTA (potencias + países en crisis)
const basePIB = {
  "United States of America": 25000,
  "China": 18000,
  "Japan": 5000,
  "Germany": 4500,
  "India": 3500,
  "United Kingdom": 3200,
  "France": 3000,
  "Brazil": 2000,
  "Russia": 2100,
  "Chile": 300,

  "Yemen": 30,
  "Afghanistan": 20,
  "Somalia": 15,
  "Haiti": 25,
  "South Sudan": 10
};

// 🧠 GENERAR ECONOMÍA COMPLETA
function generarPais(pais) {

  if (economia[pais]) return;

  let pib = basePIB[pais] || Math.floor(Math.random() * 1000) + 100;

  economia[pais] = {
    pib,
    crecimiento: (Math.random() * 0.05) - 0.01, // -1% a +5%
    inflacion: Math.random() * 0.08, // 0% a 8%
    estabilidad: Math.random(), // 0 a 1
    riqueza: pib / 100 // dinero que da
  };
}

// 📈 ACTUALIZAR ECONOMÍA GLOBAL
function actualizarEconomiaGlobal() {

  for (let pais in economia) {

    let e = economia[pais];

    // crecimiento económico
    e.pib += e.pib * e.crecimiento;

    // inflación reduce valor real
    e.riqueza = (e.pib / 100) * (1 - e.inflacion);

    // eventos aleatorios
    if (Math.random() < 0.05) {
      e.estabilidad -= 0.2;
    }

    if (Math.random() < 0.05) {
      e.estabilidad += 0.2;
    }

    // crisis
    if (e.estabilidad < 0.3) {
      e.riqueza *= 0.5;
    }

    // boom económico
    if (e.estabilidad > 0.8) {
      e.riqueza *= 1.5;
    }

    // límites
    if (e.estabilidad < 0) e.estabilidad = 0;
    if (e.estabilidad > 1) e.estabilidad = 1;
  }
}

io.on("connection", (socket) => {

  socket.on("crearSala", ({ codigo, nombre }) => {

    salas[codigo] = {
      jugadores: [],
      estado: {},
      turno: 0,
      dinero: {}
    };

    socket.join(codigo);

    salas[codigo].jugadores.push({ id: socket.id, nombre });
    salas[codigo].dinero[nombre] = 500;

    socket.emit("listaJugadores", salas[codigo].jugadores);
  });

  socket.on("unirseSala", ({ codigo, nombre }) => {

    if (!salas[codigo]) {
      socket.emit("errorSala");
      return;
    }

    socket.join(codigo);

    salas[codigo].jugadores.push({ id: socket.id, nombre });
    salas[codigo].dinero[nombre] = 500;

    io.to(codigo).emit("jugadores", salas[codigo].jugadores);
    io.to(codigo).emit("estadoInicial", salas[codigo]);

    socket.emit("listaJugadores", salas[codigo].jugadores);

    io.to(codigo).emit("turnoActual", salas[codigo].jugadores[salas[codigo].turno]);
  });

  // 💣 CONQUISTAR CON ECONOMÍA REAL
  socket.on("accion", ({ codigo, pais, jugador }) => {

    let sala = salas[codigo];
    let actual = sala.jugadores[sala.turno];

    if (!actual || actual.nombre !== jugador) return;

    generarPais(pais);

    let e = economia[pais];

    let ganancia = Math.floor(e.riqueza);

    sala.dinero[jugador] += ganancia;

    if (ganancia > 200) {
      io.to(codigo).emit("mensaje", `🚀 ${jugador} conquistó ${pais} (superpotencia)`);
    } else if (ganancia < 20) {
      io.to(codigo).emit("mensaje", `📉 ${jugador} conquistó ${pais} (economía débil)`);
    } else {
      io.to(codigo).emit("mensaje", `🌍 ${jugador} conquistó ${pais} (+${ganancia})`);
    }

    // asignar territorio
    sala.estado[pais] = jugador;

    // ranking
    rankingGlobal[jugador] = (rankingGlobal[jugador] || 0) + ganancia;

    // actualizar economía global
    actualizarEconomiaGlobal();

    io.to(codigo).emit("actualizarPais", { pais, jugador });
    io.to(codigo).emit("ranking", rankingGlobal);
    io.to(codigo).emit("dinero", sala.dinero);

    // siguiente turno
    sala.turno = (sala.turno + 1) % sala.jugadores.length;

    io.to(codigo).emit("turnoActual", sala.jugadores[sala.turno]);
  });

  // 💬 CHAT
  socket.on("chat", ({ codigo, nombre, mensaje }) => {
    io.to(codigo).emit("chat", { nombre, mensaje });
  });

  // 🎤 VOZ
  socket.on("offer", data => socket.to(data.to).emit("offer", data));
  socket.on("answer", data => socket.to(data.to).emit("answer", data));
  socket.on("ice-candidate", data => socket.to(data.to).emit("ice-candidate", data));

});

server.listen(3000, () => {
  console.log("🌍 Simulador económico mundial activo en http://localhost:3000");
});