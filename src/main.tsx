import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { playClickSound } from "./lib/sound";

// Global click listener for interactive elements to trigger sound
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('button, a, [role="button"], [role="menuitem"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"]')) {
    playClickSound();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
