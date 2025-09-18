// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

app.get('/:room', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', socket => {
  socket.on('join', room => {
    socket.join(room);
    socket.to(room).emit('user-connected', socket.id);

    socket.on('offer', (data) => {
      socket.to(room).emit('offer', data);
    });

    socket.on('answer', (data) => {
      socket.to(room).emit('answer', data);
    });

    socket.on('candidate', (data) => {
      socket.to(room).emit('candidate', data);
    });

    socket.on('disconnect', () => {
      socket.to(room).emit('user-disconnected', socket.id);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
