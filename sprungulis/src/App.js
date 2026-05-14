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
import { Box, Container, Typography, Button, Stack } from "@mui/material";
import { Lightning } from "@mui/icons-material";

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
  const [currentPage, setCurrentPage] = useState('editor');

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
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
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

    {currentPage === 'home' && (
      /* <div>
        <h1>Home Page coming soon! Inspiration(but in priede green):</h1>
        <img src="images/Capture.PNG" style={{width: '1000px'}} />
      </div> */
      <>
    {/* Promotional Banner */}
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#2d8b76',
        padding: '10px 0',
        textAlign: 'center',
      }}
    >
      <Typography
        sx={{
          color: '#fdedef',
          fontSize: '14px',
          fontWeight: '500',
          letterSpacing: '0.5px',
        }}
      >
        Free Courses 🍁 Sale Ends Soon, Get It Now →
      </Typography>
    </Box>

    {/* Main Hero Section */}
    <Container maxWidth="md">
      <Box
        sx={{
          paddingTop: '80px',
          paddingBottom: '80px',
          textAlign: 'center',
        }}
      >
        {/* Headline Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f0f0f0',
            borderRadius: '24px',
            padding: '8px 16px',
            marginBottom: '24px',
          }}
        >
          <Lightning
            sx={{
              color: '#2d8b76',
              fontSize: '18px',
            }}
          />
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#263238',
              margin: 0,
            }}
          >
            <span style={{ color: '#2d8b76', fontWeight: '700' }}>Unlock</span> Your Creative Potential
          </Typography>
        </Box>

        {/* Main Heading */}
        <Typography
          variant="h1"
          sx={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: '700',
            color: '#263238',
            marginBottom: '16px',
            lineHeight: '1.2',
          }}
        >
          with Online Design and Development Courses.
        </Typography>

        {/* Sub-heading */}
        <Typography
          variant="body1"
          sx={{
            fontSize: '16px',
            color: '#757575',
            marginBottom: '40px',
            maxWidth: '500px',
            margin: '0 auto 40px',
            lineHeight: '1.6',
          }}
        >
          Learn from Industry Experts and Enhance Your Skills.
        </Typography>

        {/* CTA Buttons */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#2d8b76',
              color: '#fdedef',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 32px',
              textTransform: 'none',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#1e6654',
                boxShadow: '0 4px 12px rgba(45, 139, 118, 0.3)',
              },
            }}
          >
            Explore Courses
          </Button>
          <Button
            variant="outlined"
            sx={{
              backgroundColor: '#ffffff',
              color: '#263238',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 32px',
              textTransform: 'none',
              borderRadius: '8px',
              border: '1.5px solid #d0d0d0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#2d8b76',
              },
            }}
          >
            View Pricing
          </Button>
        </Stack>
      </Box>

      {/* Client/Logo Ribbon */}
      <Box
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '40px 30px',
          marginBottom: '80px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f0f0f0',
        }}
      >
        <Typography
          sx={{
            fontSize: '12px',
            color: '#999',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '24px',
            fontWeight: '600',
          }}
        >
          Trusted by leading companies
        </Typography>
        <Stack
          direction="row"
          spacing={3}
          justifyContent="center"
          alignItems="center"
          sx={{
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {['zapier', 'Spotify', 'zoom', 'amazon', 'Adobe', 'Notion', 'NETFLIX'].map((company, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#999',
                textAlign: 'center',
                minWidth: '60px',
              }}
            >
              {company}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Container>
  </>
    )}
      {currentPage === 'editor' && (
        <>
          <ErrorBanner error={error} />
          <div className="editor-row">
            <EditorPanel code={code} onChange={setCode} highlight={highlight} />
            <ExplanationPanel explanations={explanations} />
          </div>
        </>
      )}

      {currentPage === 'games' && (
      <div>
        <h1>Games Page Coming Soon</h1>
      </div>
    )}


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
