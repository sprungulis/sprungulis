import React from "react";
import { Button, Checkbox, FormControlLabel } from "@mui/material";

export default function TopBar({
  autoRun,
  onAutoRunChange,
  onRun,
  onStep,
  showStep,
}) {
  return (
    <div className="nav">
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

      <div className="controls" />
    </div>
  );
}

