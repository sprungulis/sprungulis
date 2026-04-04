import React from "react";
import { Button, Checkbox, FormControlLabel } from "@mui/material";
import NavLink from "./navLink";

export default function TopBar({
  currentPage,
  onPageChange,
  autoRun,
  onAutoRunChange,
  onRun,
  onStep,
  showStep,
}) {
  return (
    <div className="nav">
      <NavLink destinationName="Sākums" onPageChange={onPageChange} currentPage={currentPage} />
      <NavLink destinationName="Redaktors" onPageChange={onPageChange} currentPage={currentPage} />
      <NavLink destinationName="Spēles" onPageChange={onPageChange} currentPage={currentPage} />

    {currentPage === 'editor' && (
      <div className="controls">
      
      <Button variant="contained" color="primary" onClick={onRun}>
        Palaist kodu
      </Button>

      <FormControlLabel
        control={<Checkbox checked={autoRun} onChange={onAutoRunChange} />}
        label="Auto"
      />

      {/* {showStep && ( */}
        <Button variant="contained" color="secondary" onClick={onStep} disabled={!showStep} className={!showStep ? "step-btn-hidden" : ""} aria-hidden={!showStep} tabIndex={showStep ? 0: -1}>
          Solis
        </Button>
      {/* )} */}
      </div>

      )}
    </div>

  );
}

