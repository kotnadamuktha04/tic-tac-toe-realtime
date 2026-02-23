import { useEffect, useState } from "react";
import { socket } from "./socket";
import "./App.css";

function App() {
  const [board,setBoard]=useState(Array(9).fill(""));
  const [roomCode,setRoomCode]=useState("");
  const [inputCode,setInputCode]=useState("");
  const [symbol,setSymbol]=useState("");
  const [turn,setTurn]=useState("X");
  const [winner,setWinner]=useState(null);
  const [name,setName]=useState("");
  const [error,setError]=useState("");
  const [opponentName,setOpponentName]=useState("");
  const [roomState,setRoomState]=useState(null);

  useEffect(()=>{
    const onRoomCreated = ({code,symbol})=>{
      setRoomCode(code);
      setSymbol(symbol);
      setError("");
    };
    const onRoomJoined = ({code,symbol})=>{
      setRoomCode(code);
      setSymbol(symbol);
      setError("");
    };
    const onError = (msg)=>{
      setError(msg);
    };
    const onGameUpdate = (room)=>{
      setRoomState(room);
      setBoard(room.board);
      setTurn(room.turn);
      setWinner(room.winner||null);
      if(room.players){
        if(symbol){
          const meName = (room.players[symbol] && room.players[symbol].name) || "";
          if(meName) setName(meName);
        }
        const opp = symbol==="X"?"O":"X";
        const oppName = (room.players[opp] && room.players[opp].name) || "";
        setOpponentName(oppName);
      }
    };

    socket.on("roomCreated", onRoomCreated);
    socket.on("roomJoined", onRoomJoined);
    socket.on("errorMsg", onError);
    socket.on("gameUpdate", onGameUpdate);
    const onGameOver = (w)=> setWinner(w);
    socket.on("gameOver", onGameOver);
    socket.on("connect_error", (err)=>{
      setError('Connection error: ' + (err && err.message ? err.message : String(err)));
    });

    return ()=>{
      socket.off("roomCreated", onRoomCreated);
      socket.off("roomJoined", onRoomJoined);
      socket.off("errorMsg", onError);
      socket.off("gameUpdate", onGameUpdate);
      socket.off("gameOver", onGameOver);
    };
  },[symbol]);

  const createRoom=()=>{
    socket.emit("createRoom", (res)=>{
      if(res && res.ok){
        setRoomCode(res.code);
        setSymbol('X');
        setError("");
      } else if(res && res.msg){
        setError(res.msg);
      }
    });
  };

  const joinRoom=()=>{
    const code = inputCode ? inputCode.trim().toUpperCase() : "";
    if(!code) { setError('Enter room code'); return; }
    setError("");
    socket.emit("joinRoom",{code}, (res)=>{
      if(res && res.ok){
        setRoomCode(code);
        setSymbol('O');
      } else if(res && res.msg){
        setError(res.msg);
      }
    });
  };

  const sendName=()=>{
    if(!roomCode || !symbol || !name) return;
    socket.emit("setName",{code:roomCode,symbol,name});
  };

  const move=(i)=>{
    socket.emit("makeMove",{code:roomCode,index:i,symbol});
  };

  const restart=()=>socket.emit("restart",{code:roomCode});

  return (
    <div className="App">
      <h1>Tic Tac Toe</h1>

      {!roomCode && (
        <>
          <button onClick={createRoom}>Create Room</button>
          <input value={inputCode} onChange={e=>setInputCode(e.target.value)} />
          <button onClick={joinRoom}>Join</button>
          {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
        </>
      )}

      {roomCode && (
        <>
          <h3>Room: {roomCode}</h3>
          <h3>You: {symbol} {name?`(${name})`:null}</h3>
          <h4>Opponent: {opponentName || 'waiting...'}</h4>
          <h3>Turn: {turn}</h3>

          <div style={{marginBottom:8}}>
            <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
            <button onClick={sendName}>Set Name</button>
          </div>

          <div className="grid">
            {board.map((c,i)=>(
              <button key={i} onClick={()=>move(i)} disabled={c!=="" || symbol!==turn || winner}>
                {c}
              </button>
            ))}
          </div>

          {winner && (
            <>
              <h2>
                {winner === "draw" ? (
                  "Draw"
                ) : (
                  `${(roomState && roomState.players && roomState.players[winner] && roomState.players[winner].name) || winner} Wins`
                )}
              </h2>
              <button onClick={restart}>Restart</button>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;