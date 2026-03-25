import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import RoboGame from "./RoboGame/RoboGame";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/RoboGame" element={<RoboGame />} />
      </Routes>
    </BrowserRouter>
  );
}
