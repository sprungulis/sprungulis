//import logo from './logo.svg';
import "./App.css";
import CodeEditor from "./codemirror6";
import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import init, { run } from "priede_wasm";
import { worker } from "./lib/priede";




function increment() {
  worker.postMessage({ type: "increment" });
}

function decrement() {
  worker.postMessage({ type: "decrement" });
}
const theme = createTheme({
  palette: {
    primary: {
      main: "#78e08f",
    },
    secondary: {
      main: "#55efc4",
    },
  },
  typography: {
    button: {
      fontFamily: "DM Sans, sans-serif",
      fontSize: "16px",
      fontWeight: "bold",
      textTransform: "none",
    },
  },
});

const initialCode = 'izvade(2+2)';

function App() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [highlight, setHighlight] = useState(null);

  worker.onmessage = (event) => {
    console.log("state update:", event.data.type);
    if (event.data.type === "code_replace") {
      const new_value = event.data.new_value;
      const line = event.data.line;
      const col = event.data.col;
      const span = event.data.span;
      console.log(new_value, line, col, span);

      // Replace the code using line, col, span, and new_value
      const lines = code.split('\n');
      if (line > 0 && line <= lines.length) {
        const targetLine = lines[line - 1];
        const before = targetLine.substring(0, col - 1);
        const after = targetLine.substring(col - 1 + span);
        const newLine = before + new_value + after;
        lines[line - 1] = newLine;
        const newCode = lines.join('\n');
        setCode(newCode);
        // Set highlight for the updated area
        setHighlight({ line: line - 1, col: col - 1, length: new_value.length });
        console.log(newCode, highlight);
        
      }
    }
  };

  useEffect(() => {
    init().then(() => {
      console.log("Priede interpreter initialized");
    });
  }, []);

  const displayText = error
    ? `Error: ${error}${output ? "\n" + output : ""}`
    : output || "No output yet.";

  return (
    <div className="App">
      <div className="nav">
        {/*         <h1>CodeMirror 6 editor</h1>
         */}{" "}
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            run(code)
          }}>
          Palaist kodu
        </Button>
        <div className="controls">
          {/*  <button type = "button" onClick={handleRun}>Run Code</button> */}
        </div>
      </div>

  

      <div className="editor-row">
        <div className="codeEditor">
          {/* <h2 className="Editor-header">Koda redaktors</h2> */}

          <CodeEditor onChange={setCode} value={code} highlight={highlight} />
        </div>

        <div className="codeExplanation">
          <h2 className="Explanation-header">Izpildes soļi</h2>
          <div className="lineExplanation">Šeit būs līnijas paskaidrojums</div>
          <div className="Steps">Šeit būs visi soļi!!!</div>
        </div>
      </div>
    </div>
  );
}

export default function AppWithTheme() {
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
}
