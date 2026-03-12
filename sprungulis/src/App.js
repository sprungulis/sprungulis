//import logo from './logo.svg';
import "./App.css";
import CodeEditor from "./codemirror6";
import { highlightTransformations } from "./codemirror6";
import React, { useEffect, useState, useRef } from "react";
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

function App() {
  let initialCode = "izvade(2+2)";
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [highlight, setHighlight] = useState(null);
  const [explanations, setExplanations] = useState([]); // queue of explanation messages

  // refs to keep state accessible inside callbacks without stale closures
  const currentCodeRef = useRef(code);
  const replaceQueueRef = useRef([]); // queue of pending replacements

  // keep ref synced with latest code state
  useEffect(() => {
    currentCodeRef.current = code;
  }, [code]);

  // baseCode is the string to operate on (helps when we call this from a ref or
  // callback). new_value is the replacement text, plus the location details.
  function replace_code(baseCode, new_value, line, col, span) {
    const initial = baseCode;
    console.log("replace request", new_value, line, col, span);
    // Replace the code using line, col, span, and new_value
    const lines = initial.split("\n");
    if (line > 0 && line <= lines.length) {
      const targetLine = lines[line - 1];
      const before = targetLine.substring(0, col - 1);
      const after = targetLine.substring(col - 1 + span);
      const newLine = before + new_value + after;
      lines[line - 1] = newLine;
      const newCode = lines.join("\n");
      // Set highlight for the updated area
      setHighlight({ line: line - 1, col: col - 1, length: new_value.length });
      return newCode;
    }
    return initial;
  }

  // message handler simply enqueues replace requests
  worker.onmessage = (event) => {
    console.log("worker message", event);
    if (event.data.type === "code_replace") {
      const { new_value, line, col, span } = event.data;
      replaceQueueRef.current.push({
        type: "code_replace",
        new_value,
        line,
        col,
        span,
      });
    }
    if (event.data.type === "explain") {
      const { message, line } = event.data;
      replaceQueueRef.current.push({ type: "explain", message, line });
    }
  };

  // polling effect: check queue and apply replacements or show explanations
  useEffect(() => {
    const interval = setInterval(() => {
      if (replaceQueueRef.current.length > 0) {
        const item = replaceQueueRef.current.shift();
        if (item.type === "code_replace") {
          setCode((prev) => {
            const updated = replace_code(
              prev,
              item.new_value,
              item.line,
              item.col,
              item.span,
            );
            return updated;
          });
        } else if (item.type === "explain") {
          setExplanations((prev) => [
            ...prev,
            { message: item.message, line: item.line },
          ]);
        }
      }
    }, 200); // adjust delay as needed

    return () => clearInterval(interval);
  }, []);

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
            // reset explanations from any prior execution
            setExplanations([]);
            const bytecode = run(code);
          }}>
          Palaist kodu
        </Button>
        <div className="controls">
          {/* <button type = "button" onClick={handleRun}>Run Code</button> */}
        </div>
      </div>

      <div className="editor-row">
        <div className="codeEditor">
          <CodeEditor onChange={setCode} value={code} highlight={highlight} />
        </div>

        <div className="codeExplanation">
          <h2 className="Explanation-header">Izpildes soļi</h2>
          {explanations.length === 0
            ? "Šeit parādīsies koda paskaidrojumi"
            : explanations.map((exp, idx) => (
                <div key={idx} className="stepMessage">
                  {exp.line ? (
                    <>
                      <span className="lineNumber">{exp.line}</span>
                      rindiņā: {exp.message}
                    </>
                  ) : (
                    exp.message
                  )}
                </div>
              ))}
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
