import React from "react";
import CodeEditor from "../codemirror6";

export default function EditorPanel({ code, onChange, highlight }) {
  return (
    <div className="codeEditor">
      <CodeEditor onChange={onChange} value={code} highlight={highlight} />
    </div>
  );
}

