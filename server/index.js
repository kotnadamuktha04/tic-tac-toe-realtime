const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// Debug endpoint to list rooms (useful if client reports "Room not found")
app.get('/rooms', (req, res) => {
  const summary = Object.fromEntries(Object.entries(rooms).map(([k, v]) => [k, {
    players: {
      X: { id: v.players.X.id, name: v.players.X.name },
      O: { id: v.players.O.id, name: v.players.O.name }
    },
    turn: v.turn,
    winner: v.winner
  }]));
  res.json(summary);
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

function generateRoomCode(){
  return Math.random().toString(36).substring(2,7).toUpperCase();
}

const wins = [
 [0,1,2],[3,4,5],[6,7,8],
 [0,3,6],[1,4,7],[2,5,8],
 [0,4,8],[2,4,6]
];

function checkWinner(board){
 for(let [a,b,c] of wins){
  if(board[a] && board[a]===board[b] && board[a]===board[c])
    return board[a];
 }
 if(board.every(c=>c)) return "draw";
 return null;
}

io.on("connection",(socket)=>{

  socket.on('disconnect', ()=>{
    // remove socket from any room players
    for(const code of Object.keys(rooms)){
      const room = rooms[code];
      if(room.players.X.id===socket.id){
        room.players.X.id = null;
        room.players.X.name = null;
        io.to(code).emit('gameUpdate', room);
        console.log(`Socket ${socket.id} disconnected from room ${code} as X`);
      }
      if(room.players.O.id===socket.id){
        room.players.O.id = null;
        room.players.O.name = null;
        io.to(code).emit('gameUpdate', room);
        console.log(`Socket ${socket.id} disconnected from room ${code} as O`);
      }
      // if both players empty, delete room
      if(!room.players.X.id && !room.players.O.id){
        delete rooms[code];
        console.log(`Room ${code} deleted (empty)`);
      }
    }
  });


 socket.on("createRoom",(ack)=>{
   const code = generateRoomCode();

  rooms[code] = {
    board: Array(9).fill(""),
    players: { X: { id: socket.id, name: null }, O: { id: null, name: null } },
    turn: "X",
    winner: null
  };

   socket.join(code);
   console.log(`Room created ${code} by ${socket.id}`);
   socket.emit("roomCreated",{code,symbol:"X"});
   if(typeof ack === 'function') ack({ ok: true, code });
  });

 socket.on("joinRoom",({code}, ack)=>{
   const key = code ? code.trim().toUpperCase() : code;
  const room = rooms[key];
  if(!room){
    console.log(`Join failed: room ${key} not found (socket ${socket.id})`);
    socket.emit("errorMsg","Room not found");
    if(typeof ack === 'function') ack({ ok: false, msg: 'Room not found' });
    return;
  }
  if(room.players.O.id){
    console.log(`Join failed: room ${key} full (socket ${socket.id})`);
    socket.emit("errorMsg","Room is full");
    if(typeof ack === 'function') ack({ ok: false, msg: 'Room is full' });
    return;
  }

  room.players.O.id = socket.id;
  socket.join(key);
  console.log(`Socket ${socket.id} joined room ${key}`);

  socket.emit("roomJoined",{code:key,symbol:"O"});
  io.to(key).emit("gameUpdate",room);
  if(typeof ack === 'function') ack({ ok: true });
 });

  socket.on("makeMove",({code,index,symbol})=>{
   const room = rooms[code];
  if(!room || room.turn!==symbol || room.board[index]!=="" || room.winner) return;

   room.board[index]=symbol;
   room.turn = symbol==="X"?"O":"X";

   const winner = checkWinner(room.board);
   if(winner){
     room.winner = winner;
     io.to(code).emit("gameOver",winner);
   }

   io.to(code).emit("gameUpdate",room);
 });

  socket.on("setName",({code,symbol,name})=>{
    const room = rooms[code];
    if(!room) return;
    if(room.players[symbol]){
      room.players[symbol].name = name;
    }
    io.to(code).emit("gameUpdate",room);
  });

 socket.on("restart",({code})=>{
   const room = rooms[code];
   if(!room) return;

   room.board = Array(9).fill("");
   room.turn="X";
   room.winner=null;

   io.to(code).emit("gameUpdate",room);
 });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on ${PORT}`));

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Use another PORT or stop the process using it.`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
