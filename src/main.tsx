import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./app.tsx";

console.log("main.tsx loaded");

try {
  ReactDOM.createRoot(document.getElementById("app")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App rendered");
} catch (err) {
  console.error("Render error", err);
}
