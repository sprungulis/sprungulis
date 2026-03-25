import { useState, useEffect } from "react";
import Game from "./Game";
import { createInitialState } from "./engine";
import { runProgram } from "./controller";

export default function RoboGame() {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    setGameState(createInitialState());
    }, []);

  if (!gameState) return <div>Loading...</div>;
  
  return (
    <div>
      <Game
        position={gameState.robotPos}
        ballPosition={gameState.ballPos}
        pickedUp={gameState.pickedUp}
        walls={gameState.walls}
        gridSize={gameState.gridSize}
      />
    </div>
  );
  //TODO: also render CodeMirror interface and execute bytecode via Priede.js 
  //TODO: Addo run poga kas interprete CodeMirro codu un tad generato game states un loopo cauri.
}