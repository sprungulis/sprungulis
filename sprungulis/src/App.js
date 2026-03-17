//import logo from './logo.svg';
import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import init, { run } from "priede_wasm";
import { worker } from "./lib/priede";
import TopBar from "./components/TopBar";
import ErrorBanner from "./components/ErrorBanner";
import EditorPanel from "./components/EditorPanel";
import ExplanationPanel from "./components/ExplanationPanel";

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
  const [autoRun, setAutoRun] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // refs to keep state accessible inside callbacks without stale closures
  const currentCodeRef = useRef(code);
  const replaceQueueRef = useRef([]); // queue of pending replacements
  const pausedRef = useRef(isPaused);
  const stoppedRef = useRef(false);

  // keep ref synced with latest code state
  useEffect(() => {
    currentCodeRef.current = code;
  }, [code]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  function stopWithError(message) {
    stoppedRef.current = true;
    replaceQueueRef.current = [];
    setError(message || "Nezināma kļūda");
    setOutput("");
    setIsPaused(true);
    pausedRef.current = true;
  }

  // Catch errors that bypass the worker path (e.g. thrown from wasm/run).
  useEffect(() => {
    function onWindowError(e) {
      const msg = e?.error?.message || e?.message;
      if (msg) stopWithError(msg);
    }

    function onUnhandledRejection(e) {
      const reason = e?.reason;
      const msg =
        typeof reason === "string"
          ? reason
          : reason?.message || "Unhandled promise rejection";
      stopWithError(msg);
    }

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

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
    if (stoppedRef.current && event.data?.type !== "error") return;
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
    if (event.data.type === "step") {
      replaceQueueRef.current.push({ type: "step" });
    }
    if (event.data.type === "error") {
      const { message } = event.data;
      stopWithError(message);
    }
  };

  function processQueueUntilStep() {
    if (stoppedRef.current) return;
    if (pausedRef.current) return;

    let localCode = currentCodeRef.current;
    const explainsToAdd = [];

    while (replaceQueueRef.current.length > 0) {
      const item = replaceQueueRef.current.shift();
      

      if (item.type === "step") {
        if (!autoRun) {
          setIsPaused(true);
          pausedRef.current = true;
        }
        break;
      }

      if (item.type === "code_replace") {
        localCode = replace_code(
          localCode,
          item.new_value,
          item.line,
          item.col,
          item.span,
        );
      } else if (item.type === "explain") {
        explainsToAdd.push({ message: item.message, line: item.line });
      }

      if (!autoRun) {
        // If auto-run is off, keep processing until we hit an explicit `step` marker.
        continue;
      }
    }

    if (localCode !== currentCodeRef.current) {
      currentCodeRef.current = localCode;
      setCode(localCode);
    }
    if (explainsToAdd.length > 0) {
      setExplanations((prev) => [...prev, ...explainsToAdd]);
    }
  }

  // polling effect: check queue and apply replacements or show explanations
  useEffect(() => {
    const interval = setInterval(() => {
      if (replaceQueueRef.current.length > 0) processQueueUntilStep();
    }, 200); // adjust delay as needed

    return () => clearInterval(interval);
  }, [autoRun]);

  useEffect(() => {
    init().then(() => {
      console.log("Priede interpreter initialized");
    });
  }, []);

  return (
    <div className="App">
      <TopBar
        autoRun={autoRun}
        onAutoRunChange={(e) => {
          const enabled = e.target.checked;
          setAutoRun(enabled);
          if (enabled) {
            setIsPaused(false);
            pausedRef.current = false;
          }
        }}
        onRun={() => {
          // reset explanations from any prior execution
          setExplanations([]);
          replaceQueueRef.current = [];
          stoppedRef.current = false;
          setError("");
          setIsPaused(false);
          pausedRef.current = false;
          try {
            const bytecode = run(code);
          } catch (e) {
            stopWithError(e?.message || String(e));
          }
        }}
        onStep={() => {
          setIsPaused(false);
          pausedRef.current = false;
          processQueueUntilStep();
        }}
        showStep={!autoRun}
      />

      <ErrorBanner error={error} />

      <div className="editor-row">
        <EditorPanel code={code} onChange={setCode} highlight={highlight} />
        <ExplanationPanel explanations={explanations} />
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
