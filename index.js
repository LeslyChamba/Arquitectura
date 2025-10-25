const express = require('express');
const http = require('http');
const path = require('path'); // Importamos 'path'
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos (CSS, JS cliente)
app.use(express.static('public'));

// --- RUTAS MEJORADAS ---
// Ruta principal (/) sirve la vista del Estudiante
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'estudiante.html'));
});

// Ruta /docente sirve la vista del Docente
app.get('/docente', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docente.html'));
});

// --- LÓGICA DEL BROKER (Socket.io) ---
io.on('connection', (socket) => {
  console.log(`Un usuario se ha conectado: ${socket.id}`);

  // Evento para que el Estudiante se una a una sala
  socket.on('unirse-sala', (sala) => {
    socket.join(sala);
    console.log(`Usuario ${socket.id} se unió a la sala: ${sala}`);
    socket.emit('conexion-exitosa', `Te has unido a la sala: ${sala}`);
  });

  // Evento del Docente para publicar una tarea
  socket.on('publicar-tarea', (data) => {
    const { sala, mensaje } = data;
    console.log(`BROKER recibió: "${mensaje}" para la Sala: "${sala}"`);
    
    // Enviar SÓLO a la sala específica
    io.to(sala).emit('nueva-notificacion', {
      mensaje: mensaje,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  // Evento del Docente "escribiendo..."
  socket.on('docente-escribiendo', (data) => {
    const { sala } = data;
    // Enviar a todos en la sala, EXCEPTO al remitente (docente)
    socket.broadcast.to(sala).emit('alguien-escribiendo');
  });

  socket.on('disconnect', () => {
    console.log(`Usuario ${socket.id} se ha desconectado`);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor (Broker) escuchando en:`);
  console.log(`  http://localhost:${PORT}   (Vista Estudiante)`);
  console.log(`  http://localhost:${PORT}/docente (Vista Docente)`);
});