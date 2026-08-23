import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import MenuWindow from "./MenuWindow";

const appWindow = getCurrentWindow();
const label = appWindow.label;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {label === "menu" ? <MenuWindow /> : <App />}
  </React.StrictMode>,
);
