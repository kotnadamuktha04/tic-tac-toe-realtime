#  Real-Time Multiplayer Tic-Tac-Toe

A **real-time multiplayer Tic-Tac-Toe game** where two players can create or join a room using a room code and play simultaneously from different devices or browser tabs.

This project demonstrates **full-stack real-time communication** using WebSockets with a modern React frontend.

---

##  Features

 Create game room with unique room code
 Join existing room using room code
 Real-time move synchronization
 Alternate player turns (X / O)
 Winner and draw detection
 Prevent invalid moves
 Restart game option
 Clean responsive UI

---

##  Tech Stack

### Frontend

* React
* Socket.io Client
* CSS

### Backend

* Node.js
* Express
* Socket.io

---

##  Project Structure

```
tic-tac-toe-realtime/
│
├── client/          # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/          # Node.js backend
│   ├── index.js
│   └── package.json
│
└── .gitignore
```

---

##  Installation & Setup

###  Clone repository

```
git clone https://github.com/kotnadamuktha04/tic-tac-toe-realtime.git
cd tic-tac-toe-realtime
```

---

###  Backend setup

```
cd server
npm install
npm start
```

Backend runs on:

```
http://localhost:5000
```

---

###  Frontend setup

Open new terminal:

```
cd client
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

##  How to Play

1. Player 1 creates a room → gets room code
2. Player 2 joins using room code
3. Game starts automatically
4. Players take turns placing X and O
5. Winner or draw is detected
6. Restart to play again

---




---

