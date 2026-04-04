import React from "react";

export default function ExplanationPanel({ explanations }) {
  return (
    <div className="codeExplanation">
      <h2 className="Explanation-header">Izpildes soļi</h2>
      {explanations.length === 0
        ? "Šeit parādīsies koda paskaidrojumi"
        : explanations.map((exp, idx) => (
            <div key={idx} className="stepMessage">
              {exp.line ? (
                <>
                  <span className="lineNumber">{exp.line}</span>
                  <span className="explanationLine">
                  rindiņā: {exp.message}
                  </span>
                </>
              ) : (
                exp.message
              )}
            </div>
          ))}
    </div>
  );
}

