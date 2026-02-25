//import logo from './logo.svg';
import './App.css';
import CodeEditor from './codemirror6';
import React, { useState } from 'react';
import { Button } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#78e08f',
    },
    secondary: {
      main: '#55efc4',
    },
  },
  typography: {
    button: {
      fontFamily:'DM Sans, sans-serif',
      fontSize: '16px',
      fontWeight: 'bold',
      textTransform: 'none',
    },
  },
});

const initialCode = '// write your code here\nconst hello = "world";\nconsole.log(hello);';


function App() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const handleRun = () => {
    const logs = [];
    const originalLog = console.log;

    console.log = (...args) => {
      logs.push(args.map(String).join(' '));
    };

    try {
      const fn = new Function(code);
      const result = fn();

      if (result !== undefined) {
        logs.push(String(result));
      }

      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      console.log = originalLog;
      setOutput(logs.join('\n'));
    }
};

const displayText = error
  ? `Error: ${error}${output ? '\n' + output : ''}`
  : output || 'No output yet.';



  return (
    <div className="App">
      <div className="nav">

{/*         <h1>CodeMirror 6 editor</h1>
 */}        <Button variant="contained" color="primary">Palaist kodu</Button>
        

        <div className="controls">
         {/*  <button type = "button" onClick={handleRun}>Run Code</button> */}
        </div>
      </div>

      {/* <div className = "er-headers">
        <div className="er-header">
          
        </div>
        <div className="er-header">
          
        </div>

      </div> */}

      <div className="editor-row">
        
        <div className="codeEditor">
          {/* <h2 className = "Editor-header">Koda redaktors</h2> */}
          
          <CodeEditor onChange={setCode} initialDoc={initialCode}/>
        </div>
        
        <div className="codeExplanation"> 
          <h2 className="Explanation-header">Izpildes soļi</h2> 
          <div className="lineExplanation">Šeit būs līnijas paskaidrojums</div>
          <div className="Steps">Šeit būs visi soļi!!!</div>
          
        </div>
        {/* <div className = "output-box">
          <div className = "output-wrapper">
            <pre className={error ? 'output-text output-error' : 'output-text'}>
              {displayText}
            </pre>
          </div>
        </div> */}
      </div>




      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
    </div>
  );
}

export default function AppWithTheme() {
  return (
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
  );
};
