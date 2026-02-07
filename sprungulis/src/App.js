//import logo from './logo.svg';
import './App.css';
import CodeEditor from './codemirror6';
import React, { useState } from 'react';
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

        <h1>CodeMirror 6 editor</h1>
        

        <div className="controls">
          <button type = "button" onClick={handleRun}>Run Code</button>
        </div>
      </div>

      <div className = "er-headers">
        <div className="er-header">
          <h1 className = "Editor-header">Koda redaktors</h1>
        </div>
        <div className="er-header">
          <h1 className="Explanation-header">Izpildes soļi</h1>
        </div>

      </div>

      <div className="editor-row">
        
        <div className="codeEditor">
          
          <CodeEditor onChange={setCode} initialDoc={initialCode}/>
        </div>
        
        <div className="codeExplanation">  
          <div className="lineExplanation"></div>
          <div className="Steps"></div>
          
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

export default App;
