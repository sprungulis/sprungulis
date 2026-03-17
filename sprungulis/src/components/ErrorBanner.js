import React from "react";
import { Alert } from "@mui/material";

export default function ErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div className="errorBanner">
      <Alert severity="error" variant="filled">
        {error}
      </Alert>
    </div>
  );
}

