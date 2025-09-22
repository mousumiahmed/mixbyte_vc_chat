const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));

const rooms = {}; // track participants per room

// Dashboard route
app.get('/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  // render a page or send data for that room
  res.render('room', { roomId });
});


// Socket.io
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    // Notify other participants
    socket.to(room).emit("user-connected", socket.id);

    socket.on("offer", ({ offer, to }) => {
      socket.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ answer, to }) => {
      socket.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("candidate", ({ candidate, to }) => {
      socket.to(to).emit("candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
      rooms[room] = rooms[room].filter(id => id !== socket.id);
      socket.to(room).emit("user-disconnected", socket.id);
    });
  });
});

http.listen(3000, () => console.log("Server running at http://localhost:3000"));