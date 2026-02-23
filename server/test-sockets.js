const { io } = require("socket.io-client");

const SERVER = process.env.SERVER_URL || "http://localhost:5001";

function wait(ms){ return new Promise(res=>setTimeout(res,ms)); }

async function run(){
  console.log("Connecting socket A");
  const a = io(SERVER);

  a.on("connect", ()=>console.log("A connected", a.id));
  a.on("roomCreated", ({code,symbol})=>{
    console.log("A created room", code, symbol);
    // now connect B and try joining
    const b = io(SERVER);
    b.on("connect", ()=>console.log("B connected", b.id));
    b.on("roomJoined", ({code,symbol})=>{
      console.log("B joined", code, symbol);
      cleanup(a,b);
    });
    b.on("errorMsg", (m)=>{
      console.log("B errorMsg:", m);
      cleanup(a,b);
    });
    // give B a moment to connect then join
    setTimeout(()=>{
      console.log("B emitting joinRoom", code);
      b.emit("joinRoom", { code });
    }, 300);
  });

  a.on("errorMsg", (m)=>{
    console.log("A errorMsg:", m);
    a.close();
  });

  a.emit("createRoom");

  // safety timeout
  setTimeout(()=>{
    console.log("Timeout reached, exiting");
    process.exit(0);
  }, 5000);
}

function cleanup(a,b){
  if(b) b.close();
  if(a) a.close();
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
