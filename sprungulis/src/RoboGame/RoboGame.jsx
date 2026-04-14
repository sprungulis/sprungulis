import { useState, useEffect, useRef } from "react";
import Game from "./Game";
import CodeEditor from "../codemirror6";
import { stateList, InitialState, onDone } from "./controller";

const ANIMATION_DELAY = 400;

export default function RoboGame() {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [renderStates, setRenderStates] = useState([]);
  const [code, setCode] = useState("move right 1\npickup\ndone");
  const initialStateRef = useRef(null);

  useEffect(() => {
    stateList.length = 0;
    const initialState = InitialState();
    initialStateRef.current = initialState;
    setGameState(initialState);
    setRenderStates([initialState]);
    setCurrentStateIndex(0);

    const unsubscribe = onDone((states) => {
      if (!states || states.length === 0) {
        return;
      }

      setRenderStates(states);
      setCurrentStateIndex(0);
      setGameState(states[0]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (renderStates.length <= 1) {
      return;
    }

    return executeAnimation(renderStates);
  }, [renderStates]);

  const executeAnimation = (states = renderStates) => {
    if (states.length <= 1) {
      return;
    }

    setIsAnimating(true);
    let index = 0;

    const animationInterval = setInterval(() => {
      if (index < states.length) {
        setCurrentStateIndex(index);
        setGameState(states[index]);
        index++;
      } else {
        clearInterval(animationInterval);
        setIsAnimating(false);
      }
    }, ANIMATION_DELAY);

    return () => clearInterval(animationInterval);
  };

  const executeCode = () => {};

  const resetCanvas = () => {
    const initialState = initialStateRef.current;

    if (!initialState) {
      return;
    }

    stateList.length = 0;
    stateList.push(initialState);
    setRenderStates([initialState]);
    setGameState(initialState);
    setCurrentStateIndex(0);
    setIsAnimating(false);
  };

  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="robo-game-container">
      <div className="game-controls">
        <div className="state-info">
          State: {currentStateIndex} / {Math.max(0, renderStates.length - 1)}
        </div>
      </div>

      <div className="editor-surface">
        <div className="editor-title">Code</div>
        <CodeEditor onChange={setCode} value={code} />
        <div className="editor-actions">
          <button onClick={executeCode} disabled={isAnimating}>Execute code</button>
          <button onClick={resetCanvas} disabled={isAnimating}>Reset canvas</button>
        </div>
      </div>

      <Game
        position={gameState.robotPos}
        ballPosition={gameState.ballPos}
        pickedUp={gameState.pickedUp}
        walls={gameState.walls}
        gridSize={gameState.gridSize}
      />

      <style jsx>{`
        .robo-game-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }
        .game-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .editor-surface {
          width: min(100%, 820px);
        }
        .editor-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }
        .editor-surface :global(.cm-editor) {
          min-height: 220px;
        }
        .editor-actions {
          margin-top: 0.75rem;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        button {
          padding: 0.5rem 1rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
        }
        button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        button:hover:not(:disabled) {
          background-color: #2563eb;
        }
        .state-info {
          font-weight: 500;
          color: #0f172a;
        }
      `}</style>
    </div>
  );

}