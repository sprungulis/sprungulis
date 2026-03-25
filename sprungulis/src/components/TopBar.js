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

      <div className="controls">
      
      <Button variant="contained" color="primary" onClick={onRun}>
        Palaist kodu
      </Button>

      <FormControlLabel
        control={<Checkbox checked={autoRun} onChange={onAutoRunChange} />}
        label="Automātiski soļot"
      />

      {showStep && (
        <Button variant="contained" color="secondary" onClick={onStep}>
          Solis
        </Button>
      )}
      </div>

      
    </div>
  );
}

