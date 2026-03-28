function unirseSala() {
  codigo = prompt("Código de sala:");
  socket.emit("unirseSala", { codigo, nombre });
}

function activarAtaque() {
  modo = "ataque";
  alert("Selecciona un país");
}

function pedirPrestamo() {
  socket.emit("prestamo", { codigo, jugador: nombre });
}